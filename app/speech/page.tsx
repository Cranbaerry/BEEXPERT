"use client";

import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";

export default function ListeningAnimationWithTranscription() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const animationRef = useRef<number>();
  const analyserRef = useRef<AnalyserNode>();
  const dataArrayRef = useRef<Uint8Array>();
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (!canvas || !ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    const drawCircle = (radius: number, color: string) => {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
      ctx.fillStyle = color;
      ctx.fill();
    };

    const animate = () => {
      if (!analyserRef.current || !dataArrayRef.current) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      analyserRef.current.getByteTimeDomainData(dataArrayRef.current);

      let sum = 0;
      for (let i = 0; i < dataArrayRef.current.length; i++) {
        sum += Math.abs(dataArrayRef.current[i] - 128);
      }
      const average = sum / dataArrayRef.current.length;

      const maxRadius = Math.min(canvas.width, canvas.height) / 2;
      const minRadius = maxRadius * 0.2;
      const radius = minRadius + (average / 128) * (maxRadius - minRadius);

      drawCircle(maxRadius, "rgba(59, 130, 246, 0.1)"); // Light blue background
      drawCircle(radius, "rgba(59, 130, 246, 0.6)"); // Pulsating circle

      animationRef.current = requestAnimationFrame(animate);
    };

    if (isListening) {
      animate();
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawCircle(
        (Math.min(canvas.width, canvas.height) / 2) * 0.2,
        "rgba(59, 130, 246, 0.6)",
      );
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isListening]);

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      source.connect(analyser);

      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      analyserRef.current = analyser;
      dataArrayRef.current = dataArray;

      // Set up speech recognition
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;

        recognitionRef.current.onresult = (event) => {
          const current = event.resultIndex;
          const transcript = event.results[current][0].transcript;
          setTranscript((prev) => prev + transcript + " ");
        };

        recognitionRef.current.start();
      } else {
        console.error("Speech recognition not supported in this browser");
      }

      setIsListening(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopListening = () => {
    setIsListening(false);
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = undefined;
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <canvas
        ref={canvasRef}
        width={300}
        height={300}
        className="border border-gray-300 rounded-lg"
      />
      <Button
        onClick={isListening ? stopListening : startListening}
        className="flex items-center space-x-2"
      >
        {isListening ? (
          <>
            <MicOff className="w-4 h-4" />
            <span>Stop Listening</span>
          </>
        ) : (
          <>
            <Mic className="w-4 h-4" />
            <span>Start Listening</span>
          </>
        )}
      </Button>
      <div className="w-full max-w-md p-4 bg-gray-100 rounded-lg mt-4">
        <h3 className="text-lg font-semibold mb-2">Transcription:</h3>
        <p className="text-sm">{transcript}</p>
      </div>
    </div>
  );
}
