import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { createClient } from "./supabase/client";
import { languages, LanguageDetails } from "./definitions";
import { File } from "@web-std/file";
import { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { formSchema } from "@/components/ui/questionnaire-form";
import { surveySchema } from "@/components/ui/evaluation-form";
import { z } from "zod";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Note: Specify client if you want to use this function in the server
// The first time you call the `createBrowserClient` from the `@supabase/ssr` package it creates a Supabase client.
// Subsequent times you call the `createBrowserClient` function from anywhere in your app, it will return you the instance that was already created
export async function getUserData(
  supabase: SupabaseClient = createClient(),
  useSession = true,
) {
  if (useSession) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.user;
  } else {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  }
}

export function getLanguageDetailsById(
  id: string,
): LanguageDetails | undefined {
  return languages.find((lang) => lang.id === id);
}

export function convertCanvasUriToFile(uri = "", fileName = "default") {
  const blob = base64ToBlob(uri, "image/png");
  const mimeType = blob.type || "application/octet-stream";
  const file = new File([blob], `${fileName}.${mimeType.split("/")[1]}`, {
    type: mimeType,
  });
  return file;
}

function base64ToBlob(base64: string, contentType = "", sliceSize = 512) {
  const byteCharacters = atob(base64.split(",")[1]);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);

    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  const blob = new Blob(byteArrays, { type: contentType });
  return blob;
}

export async function isQuestionnaireFinished() {
  const supabase = createClient();
  const user = await getUserData(supabase);

  if (user == null) return false;

  const { data, error } = await supabase
    .from("profiles")
    .select(`user_id, whatsapp_number, questionnaires(user_id)`)
    .eq("user_id", user.id ?? "")
    .order("created_at", { ascending: false });

  if (error) throw error;

  if (data == null || data.length == 0) return false;

  return data[0].user_id != null && data[0].questionnaires[0].user_id != null;
}

type questionnaireFormData = z.infer<typeof formSchema>;
export async function insertQuestionnaireData(values: questionnaireFormData) {
  const supabase = createClient();
  const user = await getUserData(supabase, false);
  if (!user) return { data: null, error: "User is not logged in" };

  try {
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .insert({
        full_name: values.fullName,
        whatsapp_number: values.whatsappNumber,
        gender: values.gender,
        profession: values.profession,
        education_level: values.educationLevel,
        school: values.school,
      })
      .select("workflow_id")
      .single();

    if (profileError) throw profileError;

    const insertData = Object.entries(values).map(([key, value]) => ({
      question_id: key,
      answer: {
        type: typeof value,
        value: value,
      },
    }));

    const { error: insertError } = await supabase.from("questionnaires").insert(insertData);
    if (insertError) throw insertError;

    const { data: workflowData, error: workflowError } = await supabase
      .from("workflows")
      .select("next_workflow_id")
      .eq("id", profileData.workflow_id)
      .single();

    if (workflowError) throw workflowError;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        workflow_id: workflowData.next_workflow_id,
      })
      .eq("user_id", user.id ?? "");

    if (updateError) throw updateError;

    return { data: { userId: user.id }, error: null };
  } catch (error: unknown) {
    const err = error as PostgrestError;
    return { data: null, error: err.message };
  }
}

type evaluationFormData = z.infer<typeof surveySchema>;
export async function insertEvaluationData(values: evaluationFormData) {
  const supabase = createClient();
  const user = await getUserData(supabase, false);
  if (!user) return { data: null, error: "User is not logged in" };

  try {
    const insertPromises = Object.entries(values).map(async ([key, value]) => {
      const answerObject = {
        type: typeof value,
        value: value,
      };

      const { error } = await supabase.from("evaluations").insert({
        evaluation_id: key,
        answer: answerObject,
      });

      if (error) throw error;
    });

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("workflow_id")
      .eq("user_id", user.id)
      .single();
    if (profileError) throw profileError;

    const { data: workflowData, error: workflowError } = await supabase
      .from("workflows")
      .select("next_workflow_id")
      .eq("id", profileData.workflow_id)
      .single();
    if (workflowError) throw workflowError;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        workflow_id: workflowData.next_workflow_id,
      })
      .eq("user_id", user.id);
    if (updateError) throw updateError;

    await Promise.all(insertPromises);
    return { data: { userId: user.id }, error: null };
  } catch (error: unknown) {
    const err = error as PostgrestError;
    return { data: null, error: err.message };
  }
}

export async function isNewUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const dateNow = new Date();

  if (user) {
    const createdDateUser = new Date(user.created_at);

    if (createdDateUser.getDate() == dateNow.getUTCDate()) return true;
    else return false;
  }
  return false;
}
