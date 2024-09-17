import { convertToCoreMessages, streamText, tool, generateObject, UserContent } from 'ai';
import { openai } from '@ai-sdk/openai';
import { findRelevantContent } from '@/lib/embeddings';
import { z } from 'zod';

export async function POST(req: Request) {
    const { messages, data } = await req.json();
    const initialMessages = messages.slice(0, -1);
    const currentMessage = messages[messages.length - 1];
    const appendCanvasImage = (messages: any[]) => {
        const lastUserMessageIndex = messages.map(message => message.role).lastIndexOf('user');
        if (lastUserMessageIndex !== -1 && data?.imageUrl) {
            const currentMessage = messages[lastUserMessageIndex].content;
            console.log('Current message:', messages[lastUserMessageIndex]);
            messages[lastUserMessageIndex].content = [
                {
                    type: 'text',
                    text: currentMessage
                },
                // {
                //     type: 'image',
                //     image: data.imageUrl,
                //     experimental_providerMetadata: {
                //         openai: { imageDetail: 'low' }
                //     }
                // }
            ];
        }

        console.log('message:', messages);
        return messages;
    };


    const result = await streamText({
        model: openai(process.env.OPENAI_GPT_MODEL ?? 'gpt-4o-mini'),
        system: `You are a helpful math tutor.
        
        Users will interact with you by sending images of their handwritten solutions on a digital canvas so you technically see the image. 
        Guide the user through the problem-solving process by offering helpful hints, explanations, and encouragement.
        
        Do NOT provide the final solution, and ensure your responses are simple, clear, and easy to understand. Keep your replies free from special formatting.
        Do not use LaTeX formatting.
        Do not use list format.
        Do not hallucinate.
        
        If a response requires information from an additional tool to generate a response, call the appropriate tools in order before responding to the user.
        ONLY respond to questions using information from tool calls.
        Be sure to adhere to any instructions in tool calls ie. if they say to responsd like "...", do exactly that.
        If the relevant information is not a direct match to the users prompt, you can be creative in deducing the answer.
        Keep responses short and concise. Answer in a single sentence where possible.
        If you are unsure, use the getInformation tool and you can use common sense to reason based on the information you do have.
        Use your abilities as a reasoning machine to answer questions based on the information you do have.`,
        // messages: convertToCoreMessages((messages)),
        messages: [
            ...convertToCoreMessages(initialMessages),
            {
                role: 'user',
                content: [
                    { type: 'text', text: currentMessage.content },
                    { type: 'image', image: new URL(data.imageUrl) },
                ],
            },
        ],
        maxToolRoundtrips: 3,
        tools: {
            understandQuery: tool({
                description: `Understand the users query. Use this tool on every prompt.`,
                parameters: z.object({
                    query: z.string().describe("the users query"),
                    toolsToCallInOrder: z
                        .array(z.string())
                        .describe(
                            "These are the tools you need to call in the order necessary to respond to the users query",
                        ),
                }),
                execute: async ({ query }) => {
                    const { object } = await generateObject({
                        model: openai("gpt-4o"),
                        system:
                            "You are a query understanding assistant. Analyze the user query and generate rewritten question.",
                        schema: z.object({
                            rewrittenQuestion: z
                                .string()
                                .describe("Rewritten question to the user's query. Be concise."),
                        }),
                        prompt: `Analyze this query: "${query}". If the user's latest query references any previous part of the conversation, please rewrite the query to include the missing context. Otherwise, return the question as is.`
                    });
                    return object.rewrittenQuestion;
                },
            }),
            getInformation: tool({
                description: `Get information from your knowledge base to answer questions.`,
                parameters: z.object({
                    rewrittenQuestion: z.string().describe("Rewritten question to the user's query. Be concise."),
                }),
                execute: async ({ rewrittenQuestion }) => {
                    const results = await findRelevantContent(rewrittenQuestion);

                    const uniqueResults = Array.from(
                        new Map(results.flat().map((item) => [item?.pageContent, item])).values(),
                    );

                    return uniqueResults;
                },
            }),
            // TODO: Remove this tool (testing purpose)
            weather: tool({
                description: 'Get the weather in a location',
                parameters: z.object({
                    location: z.string().describe('The location to get the weather for'),
                }),
                execute: async ({ location }) => ({
                    location,
                    temperature: 72 + Math.floor(Math.random() * 21) - 10,
                }),
            }),
        },
    });

    return result.toDataStreamResponse();
}