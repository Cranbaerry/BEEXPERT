import {
  convertToCoreMessages,
  streamText,
  tool,
  generateObject,
  CoreAssistantMessage,
  CoreToolMessage,
  AssistantContent,
  ToolContent,
} from "ai";
import { openai } from "@ai-sdk/openai";
import { findRelevantContent } from "@/lib/embeddings";
import { z } from "zod";
import { getLanguageDetailsById } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { Message } from "ai";
import { convertCanvasUriToFile, getUserData } from "@/lib/utils";
import { uploadImage } from "@/lib/supabase/storage";

type Metadata = {
  imageUri: string;
  languageId: string;
};

type ExtractedContent = {
  types: string[];
  content: string;
};

async function saveChat(
  currentMessage: Message,
  responseMessages: Array<CoreAssistantMessage | CoreToolMessage>,
  data: Metadata,
) {
  const supabase = createClient();
  const user = await getUserData(supabase);

  if (!user) throw new Error("User is not logged in");

  const canvasFile = convertCanvasUriToFile(data.imageUri, user.id);
  const { imageUrl, error: uploadError } = await uploadImage({
    storage: supabase.storage,
    file: canvasFile,
    bucket: "chat",
    folder: user.id,
  });

  if (uploadError) throw new Error(`Error uploading image: ${uploadError}`);

  const chatInsertions = [
    {
      role: currentMessage.role,
      content: currentMessage.content,
      image_url: imageUrl,
      language: data.languageId,
      created_at: new Date(),
      types: ["text"],
    },
    ...responseMessages.map((message) => {
      const { types, content } = extractMessageContent(message.content);
      return {
        role: message.role,
        content: content,
        image_url: imageUrl,
        language: data.languageId,
        created_at: new Date(),
        types: types,
      };
    }),
  ];

  const { error: insertError } = await supabase
    .from("chat")
    .insert(chatInsertions);

  if (insertError)
    throw new Error(`Error inserting chat: ${insertError.message}`);
}

function extractMessageContent(
  content: AssistantContent | ToolContent,
): ExtractedContent {
  if (typeof content === "string") return { types: ["text"], content };

  if (Array.isArray(content)) {
    const contentTypes: string[] = [];
    const extractedContent = content
      .map((item) => {
        if (typeof item === "object") {
          contentTypes.push(item.type);
          switch (item.type) {
            case "text":
              if (!item.text) {
                contentTypes.pop();
                return "";
              }
              return item.text;
            case "tool-result":
              return `Tool result from ${item.toolName}: ${JSON.stringify(item.result)}`;
            case "tool-call":
              return `Tool call to ${item.toolName} with args: ${JSON.stringify(item.args)}`;
            default:
              return `Unknown content type: ${JSON.stringify(item)}`;
          }
        }
        return "";
      })
      .filter((result) => result !== "")
      .join(" ");

    return { types: contentTypes, content: extractedContent };
  }

  //if (typeof content === 'object' && content.type === 'text') return content.text;
  // Handle any other unknown or unsupported content types
  return { types: ["unknown"], content: JSON.stringify(content) };
}


export async function POST(req: Request) {
  const { messages, data }: { messages: Message[]; data: Metadata } =
    await req.json();
  const initialMessages: Message[] = messages.slice(0, -1);
  const currentMessage: Message = messages[messages.length - 1];
  const langDetails = getLanguageDetailsById(data.languageId);
  const language = langDetails?.name ?? "Indonesian";
  const model = process.env.OPENAI_GPT_MODEL ?? "gpt-4o-mini";

  const systemPrompt =
    `
      You are a helpful and encouraging math tutor.

      Users will interact with you by sending images of their handwritten solutions on a digital canvas so you technically see the image. Guide the user through the problem-solving process by offering helpful hints, explanations, motivation, and encouragement.

      Do NOT provide the final solution, and ensure your responses are simple, clear, and easy to understand. Keep your replies free from special formatting. Offer words of motivation such as "You are on the right track!" and "Great effort, keep going!" Encourage persistence with phrases like "Your hard work is paying off!" or "You’re almost there, keep it up!" Provide appreciation such as "Thank you for trying, your determination is impressive" or "Your solution is correct because you never gave up!"

      ${data.languageId === 'id-ID' ? `
        IMPORTANT: FOLLOW THESE GUIDELINES TO ENSURE YOUR RESPONSES ARE EASY TO BE READ BY THE TEXT-TO-SPEECH (TTS) ENGINE:
        Use words instead of symbols. For example:

        "+" should be "plus"
        "-" should be "minus"
        "∑" should be "sum"
        "√" should be "square root"
        "α" should be "alpha"
        "β" should be "beta" For powers and exponents, use phrases like "squared" or "cubed." For example, "x²" should be "x squared."

        For fractions, use phrases like "over." For example, "1/2" should be "one over two." For integrals, use "the integral of" followed by the expression. 
        Avoid any complex formatting that cannot be spoken directly. 
      `: ''}

      If you see sinα, please add spaces between sin and α. For example, "sin α" instead of "sinα".

      If an equation is long, break it down into smaller parts. 
      Avoid bullet points or lists that cannot be spoken directly through the TTS.
      Use commas or pauses in long expressions to make them more natural for speech.

      Solve one problem at a time. If the user sends multiple problems, solve them one by one.
      Always balance feedback with motivation and appreciation to ensure the user feels supported and encouraged.
      
      If the users asks a math question, retrieve the relevant information from the knowledge base to provide an explanation or hint.
      If a response requires information from an additional tool to generate a response, call the appropriate tools in order before responding to the user.
      
      Be sure to adhere to any instructions in tool calls ie. if they say to respond like "...", do exactly that.
      If the relevant information is not a direct match to the users prompt, you can be creative in deducing the answer.
      Keep responses short and concise. Answer in a single sentence where possible.
      If you are unsure, use the getInformation tool and you can use common sense to reason based on the information you do have.
      Use your abilities as a reasoning machine to answer questions based on the information you do have.
      You will consider any extra information provided by the tool throughout the conversation.
      ONLY respond to questions using information from tool calls.

      IMPORTANT: ALWAYS reply to the user in ${language} language no matter what.
    `;

  console.log('systemPrompt', systemPrompt);
  const result = await streamText({
    model: openai(model),
    system: systemPrompt,
    messages: [
      ...convertToCoreMessages(initialMessages),
      {
        role: "user",
        content: [
          { type: "text", text: currentMessage.content },
          { type: "image", image: new URL(data.imageUri) },
        ],
      },
    ],
    maxToolRoundtrips: 3,
    tools: {
      understandQuery: tool({
        description: `Understand the user's query. Use this tool on every prompt.`,
        parameters: z.object({
          query: z.string().describe("The user's query."),
          toolsToCallInOrder: z
            .array(z.string())
            .describe(
              "These are the tools you need to call in the order necessary to respond to the user's query.",
            ),
        }),
        execute: async ({ query }) => {
          const prompt = `Analyze the user's query: "${query}".
            If it references previous parts of the conversation, rewrite it to include the missing context.
            Otherwise, return the query as is.
        
            START CONTEXT BLOCK
            ${messages.map((message) => `${message.role}: ${message.content}`).join("\n")}
            END OF CONTEXT BLOCK`
            .trim();

          console.log('prompt', prompt);
          const { object } = await generateObject({
            model: openai(model),
            system: "You are a query understanding assistant. Rewrite the user's query to include any missing context from the conversation.",
            schema: z.object({
              rewrittenQuery: z.string().describe("The rewritten user query with context."),
            }),
            prompt: prompt,
          });
          return object.rewrittenQuery;
        },
      }),
      getInformation: tool({
        description: `Retrieve relevant information from the knowledge base to answer user questions.`,
        parameters: z.object({
          rewrittenQuery: z
            .string()
            .describe("The user's query rewritten with context. Be concise."),
        }),
        execute: async ({ rewrittenQuery }) => {
          const results = await findRelevantContent(rewrittenQuery);

          const uniqueResults = Array.from(
            new Map(
              results.flat().map((item) => [item?.pageContent, item]),
            ).values(),
          );

          return uniqueResults;
        },
      }),
      // TODO: Remove this tool (testing purpose)
      // weather: tool({
      //   description: "Get the weather in a location",
      //   parameters: z.object({
      //     location: z.string().describe("The location to get the weather for"),
      //   }),
      //   execute: async ({ location }) => ({
      //     location,
      //     temperature: 72 + Math.floor(Math.random() * 21) - 10,
      //   }),
      // }),
    },
    onFinish({ responseMessages }) {
      saveChat(currentMessage, responseMessages, data);
    },
  });

  return result.toDataStreamResponse();
}
