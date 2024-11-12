"use client";
import React, { useRef, useEffect, useState, useCallback } from "react";
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
import {
  CanvasRef,
  LanguageCode,
  Profile,
  Resource,
  Workflow,
  RelevantContentItem,
} from "@/lib/definitions";
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
import { RealtimePostgresUpdatePayload } from "@supabase/supabase-js";
import FlexibleQuestionDialog from "@/components/ui/flexible-question-dialog";
import EvaluationForm from "./evaluation-form";
import QuestionnaireForm from "./questionnaire-form";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { getLanguageDetailsById } from "@/lib/utils";
import JoyrideSteps from "@/components/ui/joyride-steps";
import ResourcesDisplay from "@/components/ui/resources-display";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
const Canvas = dynamic(() => import("@/components/ui/canvas"), {
  ssr: false,
});

export default function Playground() {
  //const [setToolCall] = useState<string>();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { messages, append, setMessages, data, setData } = useChat({
    onToolCall({ toolCall }) {
      //setToolCall(toolCall.toolName);
      switch (toolCall.toolName) {
        case "getInformation":
          setStatus("Retrieving relevant information");
          break;
        case "understandQuery":
        default:
          setStatus("Thinking");
          break;
      }
    },
    onFinish: (message: Message) => {
      console.log("onFinish:", message);
      if (message.role === "assistant" && message.content.length === 0) {
        console.log("onFinish special case:", message);
        setStatus("Listening");

        const getInformationFlag = message.toolInvocations?.some(
          (invocation) => invocation.toolName === "getInformation",
        );

        if (getInformationFlag && ttsRef.current) {
          const ttsMessages: Record<LanguageCode, string> = {
            "en-US": "I have retrieved relevant information for you.",
            "id-ID":
              "Saya sudah selesai mencari informasi yang relevan untuk Anda.",
          };
          ttsRef.current.generateTTS(ttsMessages[language], language);
        }
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
    startExternalAudioVisualizationRandom: () => void;
  }>();

  const [questionSheetImageSource, setQuestionSheetImageSource] =
    useState<HTMLImageElement | null>(null);
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [status, setStatus] = useState<
    | "Listening"
    | "Speak to interrupt"
    | "Processing"
    | "Thinking"
    | "AI Disabled"
    | string
  >("Listening");
  const [activeStream, setActiveStream] = useState<"user" | "bot" | null>(null);
  const [isEmbeddingModelActive, setIsEmbeddingModelActive] =
    useState<boolean>(false);

  // const [setIsSheetLoaded] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isMessagesLoaded, setIsMessagesLoaded] = useState<boolean>(false);
  const supabase = createClient();
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const hasUserSpoken = useRef<boolean>(false);
  const [resources, setResources] = useState<Resource[]>([]);
  const [newResourcesCount, setNewResourceCount] = useState<number>(0);
  const bottomFixedDivRef = useRef<HTMLDivElement>(null);
  const width = canvasRef.current?.getDimensions()?.width ?? 0;
  const handleWorkflowChanges = async (
    payload: RealtimePostgresUpdatePayload<Profile>,
  ) => {
    const { new: newProfile } = payload;

    if (newProfile) {
      const { workflow_id } = newProfile;

      if (workflow_id) {
        loadWorkflowSetup(workflow_id);
      }
    }
  };

  const loadWorkflowSetup = useCallback(
    async (workflowId: number) => {
      const { data, error } = await supabase
        .from("workflows")
        .select("*")
        .eq("id", workflowId)
        .single();

      const workflow = data as Workflow;
      if (error) {
        toast.error("Failed to fetch workflow, please refresh and try again.");
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
              "Failed to load question sheet, please refresh and try again..",
            );
          })
          .finally(() => {
            // setIsSheetLoaded(true);
          });

      if (workflow.notify)
        toast.info(`You are now working on ${workflow?.name}.`);

      if (canvasRef.current) {
        canvasRef.current.resetCanvas();
      }
    },
    [supabase],
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const channel = supabase
    .channel("profiles-changes-pg")
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "profiles",
      },
      handleWorkflowChanges,
    )
    .subscribe();

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
        return;
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
        hasUserSpoken.current = true;
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
    if (workflow?.use_ai && hasUserSpoken.current) {
      if (messages.length > 0 && isMessagesLoaded) {
        const latestMessage = messages[messages.length - 1];
        const content = latestMessage.content;
        if (latestMessage?.role === "assistant") {
          if (content && /[.!?]$/.test(content)) {
            //setMessageBuffer(content);
            const currentMessage = content.replace(messageBufferRead, "");
            const sentences = currentMessage.match(/[^.!?]+[.!?]+/g) || [];
            setMessageBufferRead(content);

            sentences.forEach((sentence) => {
              const trimmedSentence = sentence.trim();
              if (trimmedSentence && ttsRef.current) {
                console.log("Sentence:", trimmedSentence);
                ttsRef.current.generateTTS(trimmedSentence, language);
              }
            });
          }
        }
      }
    }
  }, [messages, isMessagesLoaded, workflow, language, messageBufferRead]);

  useEffect(() => {
    const fetchInitialWorkflow = async () => {
      const user = await getUserData(supabase);
      if (!user) {
        console.error("User is not logged in");
        return;
      }

      const { data: dbProfile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
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

    setResources([
      {
        id: "1",
        title: "Trigonometric Identities - Sine and Cosine Addition Formulas",
        description:
          "Comprehensive overview of trigonometric identities, focusing on the sine and cosine addition formulas. It covers basic trigonometric concepts, such as defining sine, cosine, and tangent in relation to the sides of a right triangle. Additionally, it includes a trigonometry table for standard angles (30°, 45°, 60°, and 90°) and tips for remembering trigonometric values. The core of the document is dedicated to explaining and demonstrating the sine and cosine addition formulas, with examples illustrating their use in solving trigonometric expressions",
        link: "/resources/Trigonometric Identities_Sine and Cosine Addition Formulas.pdf",
      },
    ]);
    setNewResourceCount(1);
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
      if (!/Mobi|Android/i.test(navigator.userAgent)) {
        navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
          if (ttsRef.current) {
            ttsRef.current.startExternalAudioVisualization(stream);
          }
        });
      } else {
        if (ttsRef.current)
          ttsRef.current.startExternalAudioVisualizationRandom();
      }
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
    toast.info(
      `Language switched to ${langDetails?.name}. This change will only impact your conversation with the AI.`,
    );
  }, [language]);

  const handleTTSPlayingStatusChange = useCallback(
    (status: boolean) => {
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
    },
    [workflow?.use_ai],
  );

  useEffect(() => {
    if (workflow?.use_ai) {
      setActiveStream("user");
    }
  }, [workflow?.use_ai, setActiveStream]);

  const handleTTSOnReadingTextChange = useCallback((text: string) => {
    setCurrentlyPlayingTTSText(text.trim());
  }, []);

  const handleTTSFinishedTalking = useCallback(() => {
    setActiveStream("user");
  }, []);

  const isTabActive = useTabActive();

  const resetNewResourcesCount = useCallback(() => {
    setNewResourceCount(0);
  }, []);

  useEffect(() => {
    if (workflow?.use_ai && isTabActive && !isMuted) {
      SpeechRecognition.startListening({
        continuous: true,
        interimResults: true,
        language: language,
      });
    } else {
      SpeechRecognition.abortListening();
    }
  }, [isTabActive, isMuted, language, listening, workflow]);

  const toggleMicrophone = useCallback(() => {
    if (isMuted) {
      SpeechRecognition.startListening({
        continuous: true,
        interimResults: true,
        language: language,
      });
      setIsMuted(false);
      toast.info("Microphone is now unmuted.");
    } else {
      SpeechRecognition.abortListening();
      setIsMuted(true);
      toast.info("Microphone is now muted.");
    }
  }, [isMuted, language]);

  useEffect(() => {
    if (!data) return;

    const filteredData = data
      .filter(
        (item): item is RelevantContentItem =>
          typeof item === "object" &&
          item !== null &&
          "relevantContent" in item &&
          Array.isArray((item as RelevantContentItem).relevantContent),
      )
      .flatMap((item) => item.relevantContent);

    const newResources: Resource[] = filteredData.map((item) => ({
      id: item?.id ?? "",
      title: item?.metadata?.title ?? undefined,
      description: item?.pageContent ?? undefined,
      link: item?.metadata?.url ?? "#",
    }));

    if (newResources.length === 0) return;

    const updatedResources = resources.filter(
      (resource) =>
        !newResources.some((newResource) => newResource.id === resource.id),
    );

    const finalizedResources = [...newResources, ...updatedResources];
    const finalizedResourcesIds = finalizedResources.map(
      (resource) => resource.id,
    );
    const resourcesIds = resources.map((resource) => resource.id);

    // Prevent state update if finalizedResources is the same as current resources
    if (
      JSON.stringify(finalizedResourcesIds) !== JSON.stringify(resourcesIds)
    ) {
      finalizedResources.map(async (resource) => {
        const { title, description, link } = resource;
        if (title && description) return;
        const response = await fetch("/api/open-graph", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url: link }),
        });

        if (response.ok) {
          const data = await response.json();
          resource.title = data.ogTitle ?? title;
          resource.description =
            data.ogDescription ??
            (description && description.length > 200
              ? description.substring(0, 200) + "..."
              : description);
        } else {
          const url = new URL(link);
          resource.title = url.hostname;
          resource.description =
            description && description.length > 200
              ? description.substring(0, 200) + "..."
              : description;
        }
      });

      console.log("Final resources updated:", finalizedResources);
      setResources(finalizedResources);
      setNewResourceCount(finalizedResources.length - resources.length);
      setData(undefined);
    }
  }, [data, resources, setData]);

  useEffect(() => {
    // // Prevents scrolling while drawing
    // const handleTouchStart = (event: TouchEvent): void =>
    //   canvasRef.current?.handleTouchStartFromParent(event);
    // const handleTouchMove = (event: TouchEvent): void =>
    //   canvasRef.current?.handleTouchMoveFromParent(event);
    // const handleTouchEnd = (event: TouchEvent): void =>
    //   canvasRef.current?.handleTouchEndFromParent(event);
    // const targetDiv = bottomFixedDivRef.current;
    // if (targetDiv) {
    //   targetDiv.addEventListener("touchstart", handleTouchStart, {
    //     passive: false,
    //   });
    //   targetDiv.addEventListener("touchmove", handleTouchMove, {
    //     passive: false,
    //   });
    //   targetDiv.addEventListener("touchend", handleTouchEnd, {
    //     passive: false,
    //   });
    // }
    // return () => {
    //   if (targetDiv) {
    //     targetDiv.removeEventListener("touchmove", handleTouchMove);
    //     targetDiv.removeEventListener("touchstart", handleTouchStart);
    //     targetDiv.removeEventListener("touchend", handleTouchEnd);
    //   }
    // };
  }, []);

  return (
    <>
      <QuestionnaireForm />
      {workflow?.id === 4 && <EvaluationForm />}

      {isEmbeddingModelActive && width < 500 && (
        <>
          <AlertDialog defaultOpen={true}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Screen too smol :c</AlertDialogTitle>
                <AlertDialogDescription>
                  For the best experience, please use a device with a larger
                  screen. Optionally, you can rotate your device to landscape
                  mode for a better view. We apologize for the inconvenience.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogAction>Understood 🫡</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}

      <AlertDialog open={!browserSupportsSpeechRecognition}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Browser not supported 😔💔</AlertDialogTitle>
            <AlertDialogDescription>
              Unfortunately, your browser does not support speech recognition,
              which is essential for our app to function correctly. For the best
              experience, please use the latest version of Google Chrome or
              Microsoft Edge.
            </AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>

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
            <AlertDialogTitle>
              <VisuallyHidden>Loading</VisuallyHidden>
            </AlertDialogTitle>
            <AlertDialogDescription className="flex flex-col items-center space-y-4">
              <Icons.spinner className="h-14 w-14 animate-spin mb-2" />
              Please wait while we set things up in the background...
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
        style={{ width: "calc(100% - 8rem)", overflow: "hidden" }}
        ref={bottomFixedDivRef}
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
              {/* {finalTranscript} */}
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
                    if (value) setLanguage(value);
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
          <FlexibleQuestionDialog
            canvasRef={canvasRef.current}
            workflow={workflow}
          />
          <ResourcesDisplay
            resources={resources}
            newResourcesCount={newResourcesCount}
            resetNewResourceCount={resetNewResourcesCount}
          />
        </div>
      </div>
      <JoyrideSteps />
    </>
  );
}
