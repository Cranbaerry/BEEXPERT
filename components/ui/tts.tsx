"use client";

import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

interface TTSProps {
    width?: number;
    height?: number;
}

const TTS = forwardRef((props: TTSProps, ref) => {
    const { width = 400, height = 200 } = props;
    const [loading, setLoading] = useState(false);
    const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);

    const drawBar = (ctx: CanvasRenderingContext2D, x: number, barHeight: number, radii: number) => {
        ctx.beginPath();
        ctx.moveTo(x - radii, height / 2 + barHeight / 2);
        ctx.lineTo(x - radii, height / 2 - barHeight / 2);
        ctx.quadraticCurveTo(x - radii, height / 2 - barHeight / 2 - radii, x, height / 2 - barHeight / 2 - radii);
        ctx.quadraticCurveTo(x + radii, height / 2 - barHeight / 2 - radii, x + radii, height / 2 - barHeight / 2);
        ctx.lineTo(x + radii, height / 2 + barHeight / 2);
        ctx.quadraticCurveTo(x + radii, height / 2 + barHeight / 2 + radii, x, height / 2 + barHeight / 2 + radii);
        ctx.quadraticCurveTo(x - radii, height / 2 + barHeight / 2 + radii, x - radii, height / 2 + barHeight / 2);
        ctx.fillStyle = 'rgb(0, 0, 0)';
        ctx.fill();
        ctx.closePath();
    };

    const initialDraw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
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

    const generateTTS = async (text: string) => {
        setLoading(true);
        setIsPlaying(false);

        const mediaSource = new MediaSource();
        let sourceBuffer: SourceBuffer;

        mediaSource.addEventListener('sourceopen', () => {
            sourceBuffer = mediaSource.addSourceBuffer('audio/webm; codecs="opus"');
        });

        const audio = new Audio();
        setAudioElement(audio);
        audio.src = URL.createObjectURL(mediaSource);
        audio.oncanplay = () => {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
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
        };

        audio.onended = () => {
            //analyserRef.current = null;
            setIsPlaying(false);
        };

        const response = await fetch('/api/tts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: text, voiceName: "en-US-MichelleNeural" }),
        });

        if (response.ok) {
            const reader = response.body?.getReader();
            if (!reader) {
                console.error("Failed to get reader from response body.");
                setLoading(false);
                return;
            }

            const pump = async () => {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) {
                        if (sourceBuffer.updating) {
                            await new Promise(resolve => {
                                sourceBuffer.addEventListener('updateend', resolve, { once: true });
                            });
                        }
                        mediaSource.endOfStream();
                        break;
                    }

                    if (sourceBuffer.updating) {
                        await new Promise(resolve => {
                            sourceBuffer.addEventListener('updateend', resolve, { once: true });
                        });
                    }
                    sourceBuffer.appendBuffer(value);
                }
            };

            await pump();
        } else {
            console.error("Failed to generate TTS");
        }

        setLoading(false);
    };

    useImperativeHandle(ref, () => ({
        generateTTS,
        getTTSLoadingStatus: () => {
            return loading;
        },
        getTTSPlayingStatus: () => {
            return isPlaying;
        }
    }));

    useEffect(() => {
        const drawWaveform = () => {
            const canvas = canvasRef.current;
            const analyser = analyserRef.current;
            if (!canvas || !analyser) return;
            const ctx = canvas.getContext('2d');
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
                const barHeight = 4 + (value * (canvas.height * 0.7 - 4));
                const x = spacing * i + barWidth * i + radii;
                drawBar(ctx, x, barHeight, radii);
            }

            requestAnimationFrame(drawWaveform);
        };

        initialDraw();

        if (analyserRef.current) {
            requestAnimationFrame(drawWaveform);
        }
    }, [isPlaying, width, height]);

    return (
        <div>
            {/* <button onClick={getTTS} disabled={loading}>
                {loading ? "Generating..." : "Generate TTS"}
            </button> */}
            <canvas ref={canvasRef} width={width} height={height} />
            {/* {isPlaying && <div>Playing Audio...</div>} */}
        </div>
    );
});

export { TTS };