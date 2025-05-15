import { createClient } from "@supabase/supabase-js";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";

// Switch to HuggingFace Inference Endpoint if it has latency issues, for now this will do
// Reference: https://discuss.huggingface.co/t/question-about-hugging-face-inference-api/84571/2

// Using MatryoshkaRetriever
// Reference: https://js.langchain.com/v0.2/docs/how_to/reduce_retrieval_latency

import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
const embeddings = new HuggingFaceInferenceEmbeddings({
  model: "BAAI/bge-m3",
  apiKey: process.env.HUGGINGFACEHUB_API_KEY ?? "",
});

const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
);

export const vectorStore = new SupabaseVectorStore(embeddings, {
  client: supabaseClient,
  tableName: "documents_bge_openweb_split",
  queryName: "match_documents_bge_openweb_split",
});

// export const findRelevantContent = async (userQuery: string) => {
//   const similarGuides = await vectorStore.similaritySearchWithScore(userQuery, 5);
//   return similarGuides;

//   // DocumentInterface<Record<string, any>>[]
//   // [DocumentInterface<Record<string, any>>, number]
// };



// Define a type for the document structure
type RelevantDocument = {
  pageContent: string;
  metadata: {
    source: string;
    start_index: number;
  };
};

export const findRelevantContent = async (userQuery: string) => {
  // Return hardcoded sample documents in the required format: [RelevantDocument, number][]
  console.log("userQuery", userQuery);
  const results: [RelevantDocument, number][] = [
    [
      {
        pageContent:"Trigonometry is one of the important branches in the history of mathematics that deals with the study of the relationship between the sides and angles of a right-angled triangle. This concept is given by the Greek mathematician Hipparchus. In this article, we are going to learn the basics of trigonometry such as trigonometry functions, ratios, trigonometry table, formulas and many solved examples.",
        metadata: {
          source: "https://byjus.com/maths/trigonometry/",
          start_index: -1,
        },
      },
      0.601811718616775,
    ],
    [
      {
        pageContent: "Why a Right-Angled Triangle? Imagine we can measure along and up but want to know the direct distance and angle.",
        metadata: {
          source: "https://www.mathsisfun.com/algebra/trigonometry.html",
          start_index: -1,
        },
      },
      0.599543738419568,
    ],
    [
      {
        pageContent: "Solving for an angle in a right triangle using the trigonometric ratios: Right triangles & trigonometry Sine and cosine of complementary angles: Right triangles & trigonometry Modeling with right triangles: Right triangles & trigonometry The reciprocal trigonometric ratios",
        metadata: {
          source: "https://www.khanacademy.org/math/trigonometry",
          start_index: 0,
        },
      },
      0.598809164798,
    ],
  ];
  return results;
};

