"use client";
import React, { useRef, useEffect, useState, useCallback, use } from "react";
import "regenerator-runtime/runtime";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TTS } from "@/components/ui/tts";
import dynamic from "next/dynamic";
import { Badge } from "@/components/ui/badge";
import { CreateMessage, Message, useChat } from "ai/react";
import { ChatRequestOptions, JSONValue } from "ai";
import { toast } from "sonner";
import { CanvasRef, LanguageCode, Profile, Workflow } from "@/lib/definitions";
import { useTabActive } from "@/hooks/use-tab-active";
// import { DialogFinalAnswer } from "./final-answer-dialog";
import { Icons } from "@/components/ui/icons";
import { Button } from "./button";
import { Mic, MicOff } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";
import ChatDrawer from "@/components/ui/chat-drawer";
import { getUserData } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { RealtimePostgresUpdatePayload } from '@supabase/supabase-js';
import FlexibleQuestionDialog from "@/components/ui/flexible-question-dialog";
import EvaluationForm from "./evaluation-form";
import QuestionnaireForm from "./questionnaire-form";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { getLanguageDetailsById } from "@/lib/utils";
import JoyrideSteps from "@/components/ui/joyride-steps";

const Canvas = dynamic(() => import("@/components/ui/canvas"), {
  ssr: false,
});

export default function Playground() {
  //const [setToolCall] = useState<string>();
  const { messages, append, setMessages } = useChat({
    // onToolCall({ toolCall }) {
    //     //setToolCall(toolCall.toolName);
    //     setStatus(`Thinking`);
    // },
    onFinish: (message: Message) => {
      if (!/[.!?:]$/.test(message.content)) {
        console.log("onFinish special case:", message.content);
        setMessageBuffer(message.content);
      }
    },
    onError: (error: Error) => {
      console.error("Error:", error);
      toast.error(
        "There was an error processing your request. Please try again.",
      );
      setStatus("Listening");
    },
  });

  const [language, setLanguage] = useState<LanguageCode>("en-US");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const onChangeLanguage = (language: LanguageCode) => setLanguage(language);
  const [messageBuffer, setMessageBuffer] = useState<string>("");
  const [messageBufferRead, setMessageBufferRead] = useState<string>("");
  const [currentlyPlayingTTSText, setCurrentlyPlayingTTSText] =
    useState<string>("");
  const canvasRef = useRef<CanvasRef>(null);
  const ttsRef = useRef<{
    generateTTS: (text: string, language: string) => void;
    getTTSLoadingStatus: () => boolean;
    getTTSPlayingStatus: () => boolean;
    getTTSQueueCount: () => number;
    clearTTSQueue: () => void;
    startExternalAudioVisualization: (stream: MediaStream) => void;
  }>();

  const [questionSheetImageSource, setQuestionSheetImageSource] =
    useState<HTMLImageElement | null>(null);
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [status, setStatus] = useState<
    "Listening" | "Speak to interrupt" | "Processing" | "Thinking" | "AI Disabled"
  >("Listening");
  const [activeStream, setActiveStream] = useState<"user" | "bot" | null>(
    null,
  );
  const [isEmbeddingModelActive, setIsEmbeddingModelActive] =
    useState<boolean>(false);

  // const [setIsSheetLoaded] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isMessagesLoaded, setIsMessagesLoaded] = useState<boolean>(false);
  const supabase = createClient();
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const handleWorkflowChanges = async (payload: RealtimePostgresUpdatePayload<Profile>) => {
    const { new: newProfile } = payload;

    if (newProfile) {
      const { workflow_id } = newProfile;

      if (workflow_id) {
        loadWorkflowSetup(workflow_id);
      }
    }
  };

  const loadWorkflowSetup = useCallback(async (workflowId: number) => {
    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', workflowId)
      .single();

    const workflow = data as Workflow;
    if (error) {
      toast.error('Failed to fetch workflow, please refresh and try again.');
      return;
    }

    setWorkflow(workflow);
    // setIsSheetLoaded(false);
    if (workflow?.image_url)
      loadImage(workflow?.image_url)
        .then((image) => {
          setQuestionSheetImageSource(image);
        })
        .catch(() => {
          toast.error(
            'Failed to load question sheet, please refresh and try again..'
          );
        }).finally(() => {
          // setIsSheetLoaded(true);
        });

    if (workflow.notify) {
      toast.info(`You are now working on ${workflow?.name}.`);
    }
  }, [supabase]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const channel = supabase
    .channel('profiles-changes-pg')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
      },
      handleWorkflowChanges
    )
    .subscribe()

  const {
    transcript,
    finalTranscript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
  } = useSpeechRecognition();

  const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = url;
      img.onload = () => resolve(img);
      img.onerror = reject;
    });
  };

  useEffect(() => {
    const sendTranscript = () => {
      if (!workflow?.use_ai) {
        toast.info("AI is disabled for this assessment.");
        return
      }
      if (finalTranscript.trim() !== "") {
        setStatus("Processing");
        if (ttsRef.current) ttsRef.current.clearTTSQueue();
        const canvasDataUrl = canvasRef.current?.handleExport();
        const message: CreateMessage = {
          role: "user",
          content: finalTranscript.trim(),
        };

        const options: ChatRequestOptions = {
          data: {
            imageUri: canvasDataUrl as JSONValue,
            languageId: language as JSONValue,
          },
        };

        console.log("Sending transcript:", finalTranscript);
        append(message, canvasDataUrl ? options : undefined);
      }
    };

    if (finalTranscript) {
      if (pauseTimerRef.current) {
        clearTimeout(pauseTimerRef.current);
      }
      pauseTimerRef.current = setTimeout(() => {
        sendTranscript();
        resetTranscript();
      }, 2000);
    }

    // Clean up the timer on unmount or when finalTranscript changes
    return () => {
      if (pauseTimerRef.current) {
        clearTimeout(pauseTimerRef.current);
      }
    };
  }, [finalTranscript, append, resetTranscript, language, workflow]);

  useEffect(() => {
    if (workflow?.use_ai) {
      if (messages.length > 0 && isMessagesLoaded) {
        const latestMessage = messages[messages.length - 1];
        const content = latestMessage.content;
        if (latestMessage?.role === "assistant") {
          if (content && /[.!?:]$/.test(content)) {
            setMessageBuffer(content);
          }
        }
      }
    }
  }, [messages, isMessagesLoaded, workflow]);

  useEffect(() => {
    if (workflow?.use_ai && messageBuffer.length > 0) {
      const currentMessage = messageBuffer.replace(messageBufferRead, "");
      const sentences = currentMessage.match(/[^.!?]+[.!?]+/g) || [];
      setMessageBufferRead(messageBuffer);

      sentences.forEach((sentence) => {
        const trimmedSentence = sentence.trim();
        if (trimmedSentence && ttsRef.current) {
          console.log("Sentence:", trimmedSentence);
          ttsRef.current.generateTTS(trimmedSentence, language);
        }
      });
    }
  }, [messageBuffer, messageBufferRead, language, workflow]);

  useEffect(() => {
    const fetchInitialWorkflow = async () => {
      const user = await getUserData(supabase);
      if (!user) {
        console.error('User is not logged in');
        return;
      }

      const { data: dbProfile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      const profile = dbProfile as Profile;
      if (profile.workflow_id) {
        loadWorkflowSetup(profile.workflow_id);
      }
    };

    const handleEmbeddingModelLoad = async () => {
      const callApiUntilOk = async () => {
        try {
          const response = await fetch("/api/check-embedding");

          if (response.ok) {
            setIsEmbeddingModelActive(true);
            return;
          }
        } catch (error) {
          console.error("API call failed", error);
        }

        setTimeout(callApiUntilOk, 1000);
      };

      callApiUntilOk();
    };

    const handleMessagesLoad = async () => {
      const user = await getUserData(supabase);
      if (!user) {
        console.error("User is not logged in");
        return;
      }

      const { data: dbMessages, error } = await supabase
        .from("chat")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
        return;
      }

      interface DbMessage {
        id: string;
        role: "function" | "user" | "data" | "system" | "assistant" | "tool";
        content: string;
        created_at: Date;
        types: string[];
      }

      const messages: Message[] = dbMessages
        .filter(
          (dbMessage: DbMessage) =>
            Array.isArray(dbMessage.types) && dbMessage.types.includes("text"),
        )
        .map((dbMessage: DbMessage) => {
          return {
            id: dbMessage.id,
            role: dbMessage.role,
            content: dbMessage.content,
            createdAt: dbMessage.created_at,
          };
        });
      setMessages(messages);
      setIsMessagesLoaded(true);
    };

    fetchInitialWorkflow();
    handleEmbeddingModelLoad();
    handleMessagesLoad();
  }, [setMessages, supabase, loadWorkflowSetup]);

  useEffect(() => {
    console.log("activeStream changed:", activeStream);
    if (activeStream === null) {
      setStatus("AI Disabled");
    } else if (activeStream === "user") {
      setStatus("Listening");
      console.log("Clearing TTS queue");
      if (ttsRef.current) ttsRef.current.clearTTSQueue();
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        if (ttsRef.current) {
          ttsRef.current.startExternalAudioVisualization(stream);
        }
      });
    } else {
      setStatus("Speak to interrupt");
    }
  }, [activeStream]);

  useEffect(() => {
    if (transcript.trim() !== "" && workflow?.use_ai) {
      setActiveStream("user");
    }
  }, [transcript, workflow?.use_ai]);

  useEffect(() => {
    const langDetails = getLanguageDetailsById(language);
    toast.info(`Language switched to ${langDetails?.name}. This change will only impact your conversation with the AI.`);
  }, [language]);

  const handleTTSPlayingStatusChange = useCallback((status: boolean) => {
    const tts = ttsRef.current;
    if (tts)
      console.log(
        "ttsStatus: %s, queue count: %d",
        status,
        tts?.getTTSQueueCount(),
      );

    if (!workflow?.use_ai) {
      setActiveStream(null);
    } else if (status) {
      setActiveStream("bot");
    }

  }, [workflow?.use_ai]);

  const handleTTSOnReadingTextChange = useCallback((text: string) => {
    setCurrentlyPlayingTTSText(text.trim());
  }, []);

  const handleTTSFinishedTalking = useCallback(() => {
    setActiveStream("user");
  }, []);

  const isTabActive = useTabActive();

  useEffect(() => {
    if (workflow?.use_ai && isTabActive && !isMuted) {
      SpeechRecognition.startListening({
        continuous: true,
        interimResults: true,
        language: language,
      });
    } else {
      // if (listening) {
      //   SpeechRecognition.stopListening();
      // }
      SpeechRecognition.abortListening();
    }
  }, [isTabActive, isMuted, language, listening, workflow]);

  const toggleMicrophone = useCallback(() => {
    if (isMuted) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((mediaStream) => {
          setStream(mediaStream);
          setIsMuted(false);
          SpeechRecognition.startListening({
            continuous: true,
            interimResults: true,
            language: language,
          });
          toast.info("Microphone is now unmuted.");
        })
        .catch((error) => {
          console.error("Error accessing microphone:", error);
          toast.error(
            "Failed to access microphone. Please check your permissions.",
          );
        });
    } else {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
      // SpeechRecognition.stopListening();
      SpeechRecognition.abortListening();
      setIsMuted(true);
      toast.info("Microphone is now muted.");
    }
  }, [isMuted, stream, language]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  return (
    <>
      <QuestionnaireForm />
      {workflow?.id === 4 && <EvaluationForm />}
      {!browserSupportsSpeechRecognition && (
        <AlertDialog defaultOpen={true}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Browser not supported</AlertDialogTitle>
              <AlertDialogDescription>
                Your browser doesn&apos;t support speech recognition. For a
                smooth experience, please try using the latest version of Google
                Chrome or Microsoft Edge.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction>Got it!</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {!isMicrophoneAvailable && (
        <AlertDialog defaultOpen={true}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Microphone not recognized</AlertDialogTitle>
              <AlertDialogDescription>
                Please allow this web page to use your microphone before
                transcription can begin.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction>Got it!</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <AlertDialog open={!isEmbeddingModelActive}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogDescription className="flex flex-col items-center space-y-4">
              <Icons.spinner className="h-14 w-14 animate-spin" />
              <p>Please wait while we set things up in the background...</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>

      <Canvas
        backgroundColor={"#FFFFFF"}
        canvasRef={canvasRef}
        questionsSheetImageSource={questionSheetImageSource}
      />
      <div
        className="fixed bottom-8 left-24 flex items-end space-x-2"
        style={{ width: "calc(100% - 8rem)" }}
      >
        <div className="flex items-center">
          <TTS
            ref={ttsRef}
            width={50}
            height={40}
            onPlayingStatusChange={handleTTSPlayingStatusChange}
            onReadingTextChange={handleTTSOnReadingTextChange}
            onFinishedTalking={handleTTSFinishedTalking}
          />
          <Badge className="mx-2 whitespace-nowrap">{status}</Badge>
        </div>

        <div className="flex-auto w-full self-center">
          <div className="text-helper">
            <span className="status whitespace-normal break-all w-full">
              {activeStream === "user" ? transcript : currentlyPlayingTTSText}
            </span>
          </div>
        </div>

        <div className="flex space-x-2 mb-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <ToggleGroup
                  id="language-toggle"
                  type="single"
                  value={language}
                  onValueChange={(value) => {
                    if (value) setLanguage(value)
                    toast.info(`Bee AI's language changed to ${value}`);
                  }}
                  className="border rounded-lg"
                >
                  <ToggleGroupItem value="en-US" aria-label="Toggle English">
                    EN
                  </ToggleGroupItem>
                  <ToggleGroupItem value="id-ID" aria-label="Toggle Indonesian">
                    ID
                  </ToggleGroupItem>
                </ToggleGroup>
              </TooltipTrigger>
              <TooltipContent>
                <p>Switch language</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={toggleMicrophone}
                  aria-label={isMuted ? "Mute microphone" : "Unmute microphone"}
                  variant="outline"
                  className="tool__mute p-3"
                >
                  {isMuted ? (
                    <MicOff className="h-5 w-5 text-black" />
                  ) : (
                    <Mic className="h-5 w-5 text-black" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isMuted ? "Unmute microphone" : "Mute microphone"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <ChatDrawer chatLog={messages} />
          <FlexibleQuestionDialog canvasRef={canvasRef.current} workflow={workflow} />
        </div>
      </div>
      <JoyrideSteps />
    </>
  );
}
