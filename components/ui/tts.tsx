"use client";
import React, {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from "react";
import { useTaskQueue, TaskQueue, TaskRunner } from "@/hooks/use-task-queue";
interface TTSProps {
  width?: number;
  height?: number;
  onPlayingStatusChange: (status: boolean) => void;
  onReadingTextChange: (text: string) => void;
  onFinishedTalking: () => void;
}

interface TTSQueueItem {
  id: number;
  text: string;
  audioBuffer: Promise<ReadableStream<Uint8Array> | null>;
}

interface TTSQueueResult {
  status: boolean;
}

const TTS = forwardRef((props: TTSProps, ref) => {
  const {
    width = 400,
    height = 200,
    onPlayingStatusChange,
    onReadingTextChange,
    onFinishedTalking,
  } = props;
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [readingText, setReadingText] = useState<string>("");
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const ttsQueueRunner: TaskRunner<TTSQueueItem, TTSQueueResult> = useCallback(
    (task: TTSQueueItem) => {
      return new Promise<TTSQueueResult>(async (resolve, reject) => {
        const audioStream = await task.audioBuffer;
        if (audioStream) {
          console.log("Playing:", task.text);
          setReadingText(task.text);
          await playAudio(audioStream);
          resolve({ status: true });
        } else {
          console.error("Error on playing:", task.text);
          reject({ status: false });
        }
      });
    },
    [],
  );

  const ttsQueue = useRef(
    new TaskQueue<TTSQueueItem, TTSQueueResult>(ttsQueueRunner),
  ).current;
  const ttsQueueSequence = useRef(0);
  const ttsQueueSequenceInterim = useRef(0);
  const { add, clear, onFinished } = useTaskQueue(ttsQueue);
  onFinished(() => {
    console.log("All tasks have been completed!");
    onFinishedTalking();
  });

  const drawBar = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      x: number,
      barHeight: number,
      radii: number,
    ) => {
      ctx.beginPath();
      ctx.moveTo(x - radii, height / 2 + barHeight / 2);
      ctx.lineTo(x - radii, height / 2 - barHeight / 2);
      ctx.quadraticCurveTo(
        x - radii,
        height / 2 - barHeight / 2 - radii,
        x,
        height / 2 - barHeight / 2 - radii,
      );
      ctx.quadraticCurveTo(
        x + radii,
        height / 2 - barHeight / 2 - radii,
        x + radii,
        height / 2 - barHeight / 2,
      );
      ctx.lineTo(x + radii, height / 2 + barHeight / 2);
      ctx.quadraticCurveTo(
        x + radii,
        height / 2 + barHeight / 2 + radii,
        x,
        height / 2 + barHeight / 2 + radii,
      );
      ctx.quadraticCurveTo(
        x - radii,
        height / 2 + barHeight / 2 + radii,
        x - radii,
        height / 2 + barHeight / 2,
      );
      ctx.fillStyle = "rgb(0, 0, 0)";
      ctx.fill();
      ctx.closePath();
    },
    [height],
  );

  const fetchAudio = async (
    text: string,
    language: string,
  ): Promise<ReadableStream<Uint8Array> | null> => {
    console.log("fetchAudio:", text);
    const response = await fetch("/api/tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: text, language: language }),
    });

    if (response.ok) {
      return response.body;
    } else {
      console.error("Failed to generate TTS");
      return null;
    }
  };

  const playAudio = async (
    audioStream: ReadableStream<Uint8Array>,
  ): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      try {
        if (currentAudioRef.current) {
          currentAudioRef.current.pause();
          setIsPlaying(false);
        }

        const mediaSource = new MediaSource();
        let sourceBuffer: SourceBuffer;

        mediaSource.addEventListener("sourceopen", async () => {
          try {
            sourceBuffer = mediaSource.addSourceBuffer(
              'audio/webm; codecs="opus"',
            );

            // Stream the audio progressively
            const reader = audioStream.getReader();
            console.log("Start streaming audio");
            const processNextChunk = async () => {
              const { value, done: streamDone } = await reader.read();
              if (value) {
                if (!sourceBuffer.updating) {
                  sourceBuffer.appendBuffer(value); // Append the chunk
                } else {
                  // Wait for the buffer to be ready
                  await new Promise((resolve) => {
                    sourceBuffer.addEventListener("updateend", resolve, {
                      once: true,
                    });
                  });
                  sourceBuffer.appendBuffer(value);
                }
              }
              if (streamDone) {
                if (!sourceBuffer.updating) {
                  mediaSource.endOfStream();
                } else {
                  sourceBuffer.addEventListener(
                    "updateend",
                    () => {
                      mediaSource.endOfStream();
                    },
                    { once: true },
                  );
                }
                return;
              }
              sourceBuffer.addEventListener("updateend", processNextChunk, {
                once: true,
              });
            };
            processNextChunk();
            console.log("End streaming audio");
          } catch (err) {
            console.error("Error during source buffer setup:", err);
            reject(err);
          }
        });

        const audio = new Audio();
        audio.src = URL.createObjectURL(mediaSource);
        currentAudioRef.current = audio;
        audio.oncanplay = () => {
          try {
            const audioContext = new (window.AudioContext ||
              (window as any).webkitAudioContext)(); // eslint-disable-line
            const analyserNode = audioContext.createAnalyser();

            analyserNode.fftSize = 2048;
            analyserNode.minDecibels = -160;
            analyserNode.maxDecibels = -20;

            const source = audioContext.createMediaElementSource(audio);
            source.connect(analyserNode);
            analyserNode.connect(audioContext.destination);

            analyserRef.current = analyserNode;

            audio.play();
            setIsPlaying(true);
          } catch (err) {
            console.error("Error during audio playback setup:", err);
            reject(err);
          }
        };

        audio.onended = () => {
          setIsPlaying(false);
          resolve();
        };

        audio.onerror = (err) => {
          console.error("Audio playback error:", err);
          reject(err);
        };
      } catch (err) {
        console.error("Error during playAudio setup:", err);
        reject(err);
      }
    });
  };

  useImperativeHandle(ref, () => ({
    generateTTS: async (text: string, language: string) => {
      setLoading(true);
      console.log("generateTTS:", text);
      const newTask: TTSQueueItem = {
        id: ++ttsQueueSequence.current,
        text: text,
        audioBuffer: fetchAudio(text, language),
      };

      ++ttsQueueSequenceInterim.current;
      add(newTask)
        .then(() => {
          setReadingText("");
        })
        .catch((err) => {
          console.warn(
            "Problem adding new audio queue task, user may have interrupted the bot: ",
            err,
          );
        })
        .finally(() => {
          --ttsQueueSequenceInterim.current;
        });

      setLoading(false);
    },
    getTTSLoadingStatus: () => {
      return loading;
    },
    getTTSPlayingStatus: () => {
      return isPlaying;
    },
    getTTSQueueCount: () => {
      return ttsQueueSequenceInterim.current;
    },
    clearTTSQueue: () => {
      if (ttsQueueSequenceInterim.current) ttsQueueSequenceInterim.current = 0;
      if (currentAudioRef.current) currentAudioRef.current.pause();
      clear();
    },
    startExternalAudioVisualization: (stream: MediaStream) => {
      if (analyserRef.current) analyserRef.current.disconnect();

      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)(); // eslint-disable-line
      const analyserNode = audioContext.createAnalyser();

      analyserNode.fftSize = 2048;
      analyserNode.minDecibels = -160;
      analyserNode.maxDecibels = -20;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyserNode);
      analyserRef.current = analyserNode;

      requestAnimationFrame(drawWaveform);
    },
    startExternalAudioVisualizationRandom: () => {
      const drawRandomWaveform = () => {
        // Generate base data array only once
        const randomDataArray = new Uint8Array(2048);
        for (let i = 0; i < randomDataArray.length; i++) {
          randomDataArray[i] = Math.floor(Math.random() * 256);
        }

        let phase = 0; // Track the phase of the wave

        const drawFrame = () => {
          const canvas = canvasRef.current;
          if (!canvas) return;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;

          ctx.clearRect(0, 0, canvas.width, canvas.height);

          const barWidth = canvas.width / 4.5;
          const spacing = (canvas.width - barWidth * 4) / 3;
          const radii = barWidth / 2;

          for (let i = 0; i < 4; i++) {
            const index = Math.floor(
              Math.pow(i / 4, 2) * (randomDataArray.length - 1),
            );

            // Create a smooth wave using a sine function
            const waveValue = (Math.sin(phase + (i * Math.PI) / 2) + 1) / 2; // range [0, 1]
            const value = (randomDataArray[index] / 255) * waveValue;
            const barHeight = 4 + value * (canvas.height * 0.7 - 4);
            const x = spacing * i + barWidth * i + radii;

            drawBar(ctx, x, barHeight, radii);
          }

          // Increment the phase to simulate a smooth wave-like motion
          phase += 0.02;

          // Smooth out with requestAnimationFrame without additional delay
          requestAnimationFrame(drawFrame);
        };

        drawFrame();
      };

      drawRandomWaveform();
    },
  }));

  useEffect(() => {
    onReadingTextChange(readingText);
  }, [readingText, onReadingTextChange]);

  useEffect(() => {
    onPlayingStatusChange(isPlaying);
  }, [isPlaying, onPlayingStatusChange]);

  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const barWidth = canvas.width / 4.5;
    const spacing = (canvas.width - barWidth * 4) / 3;
    const radii = barWidth / 2;

    for (let i = 0; i < 4; i++) {
      const index = Math.floor(Math.pow(i / 4, 2) * (bufferLength - 1));
      const value = dataArray[index] / 255;
      const barHeight = 4 + value * (canvas.height * 0.7 - 4);
      const x = spacing * i + barWidth * i + radii;
      drawBar(ctx, x, barHeight, radii);
    }

    requestAnimationFrame(drawWaveform);
  }, [drawBar]);

  useEffect(() => {
    const initialDraw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = canvas.width / 4.5;
      const spacing = (canvas.width - barWidth * 4) / 3;
      const radii = barWidth / 2;

      for (let i = 0; i < 4; i++) {
        const x = spacing * i + barWidth * i + radii;
        drawBar(ctx, x, 4, radii);
      }
    };
    initialDraw();

    if (analyserRef.current) {
      requestAnimationFrame(drawWaveform);
    }
  }, [isPlaying, width, height, drawWaveform, drawBar]);

  return (
    <div>
      <canvas ref={canvasRef} width={width} height={height} />
    </div>
  );
});

TTS.displayName = "TTS";
export { TTS };
