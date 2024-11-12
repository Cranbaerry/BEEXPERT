import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { getLanguageDetailsById } from "@/lib/utils";

export async function POST(req: Request) {
  const { text, language } = await req.json();
  const tts = new MsEdgeTTS();

  // Replace "cos" with "kos" to avoid Azure TTS mispronouncing it as "cos" in Bahasa Indonesia
  let processedText = text;
  if (language === "id-ID")
    processedText = text
      .replace(/\bcos\b/gi, "kos")
      .replace(/\bcosinus\b/gi, "kosinus")
      .replace(/α/gi, "alpha")
      .replace(/β/gi, "beta")
      .replace(/\+/gi, "tambah")
      //.replace(/-/gi, "kurang")
      .replace(/=/gi, "sama dengan")
      .replace(/·/gi, "dikali");

  if (language === "en-US")
    processedText = text
      .replace(/·/gi, "times")
      .replace(/\*/gi, "times")
      .replace(/-/gi, "minus");

  // VOICE LIST: https://gist.github.com/BettyJJ/17cbaa1de96235a7f5773b8690a20462
  const langDetails = getLanguageDetailsById(language);
  const voiceName = langDetails?.azureSpeechVoiceName ?? "id-ID-ArdiNeural";
  await tts.setMetadata(voiceName, OUTPUT_FORMAT.WEBM_24KHZ_16BIT_MONO_OPUS);

  const readable = tts.toStream(processedText);
  const stream = new ReadableStream({
    async start(controller) {
      readable.on("data", (chunk) => {
        controller.enqueue(chunk);
      });

      readable.on("end", () => {
        controller.close();
      });

      readable.on("error", (error) => {
        controller.error(error);
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "audio/webm",
    },
  });
}
