import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { createClient } from "./supabase/client";
import { languages, LanguageDetails } from "./definitions";
import { File } from '@web-std/file';
import { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { formSchema } from '@/components/ui/questionnaire-form'
import { z } from 'zod'
import { JSONValue } from "ai";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Note: Specify client if you want to use this function in the server
// The first time you call the `createBrowserClient` from the `@supabase/ssr` package it creates a Supabase client. 
// Subsequent times you call the `createBrowserClient` function from anywhere in your app, it will return you the instance that was already created 
export async function getUserData(supabase: SupabaseClient = createClient(), useSession = true) {
  if (useSession) {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user;
  } else {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }
}

export function getLanguageDetailsById(id: string): LanguageDetails | undefined {
  return languages.find(lang => lang.id === id);
}

export function convertCanvasUriToFile(uri = "", fileName = "default") {
  const blob = base64ToBlob(uri, "image/png")
  const mimeType = blob.type || "application/octet-stream";
  const file = new File([blob], `${fileName}.${mimeType.split("/")[1]}`, {
    type: mimeType,
  });
  return file;
}

function base64ToBlob(base64: string, contentType = "",
  sliceSize = 512) {
  const byteCharacters = atob(base64.split(",")[1]);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length;
    offset += sliceSize) {
    const slice = byteCharacters.slice(
      offset, offset + sliceSize);

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
  const supabase = createClient()
  const user = await getUserData(supabase)

  if (user == null) return false;

  const { data, error } = await supabase
    .from('profiles')
    .select(`user_id, whatsapp_number, questionnaires(user_id)`)
    .eq("user_id", user.id ?? '')
    .order('created_at', { ascending: false });

  console.log('data', data)
  if (error) throw error;

  if (data == null || data.length == 0)
    return false;

  return data[0].user_id != null && data[0].questionnaires[0].user_id != null;
}

type FormData = z.infer<typeof formSchema>;
export async function insertQuestionnaireData(values: FormData) {
  const supabase = createClient();
  const user = await getUserData(supabase);
  if (!user) return { error: 'User is not logged in' };

  const { data, error } = await supabase.from('profiles').insert({
    full_name: values.fullName,
    whatsapp_number: values.whatsappNumber,
    gender: values.gender,
    profession: values.profession,
    education_level: values.educationLevel,
    school: values.school,
  }).select();
  if (error) return { error: error.message };


  const insertPromises = Object.entries(values).map(async ([key, value]) => {
    let answerObject = {
      type: typeof value,
      value: value,
    }

    const { error } = await supabase.from('questionnaires').insert({
      question_id: key,
      answer: answerObject,
    });
    if (error) throw error;
  });

  try {
    await Promise.all(insertPromises);
  } catch (error: unknown) {
    const err = error as PostgrestError;
    return { error: err.message };
  }

  return { data: { userId: user.id } };
}