"use client";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Header } from "@/components/ui/header";
import EvaluationForm from "@/components/ui/evaluation-form";

const FormSchema = z.object({
  eval1: z.string().min(10, {
    message: "Jawaban harus setidaknya 10 karakter.",
  }),
  eval2: z.string().min(10, {
    message: "Jawaban harus setidaknya 10 karakter.",
  }),
  eval3: z.string().min(10, {
    message: "Jawaban harus setidaknya 10 karakter.",
  }),
  eval4: z.string().min(10, {
    message: "Jawaban harus setidaknya 10 karakter.",
  }),
});

export default function PetunjukPengunaan() {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });

  function onSubmit(data: z.infer<typeof FormSchema>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    console.log(data);
  }

  return (
    <>
    <EvaluationForm/>
      <Header isFixed enableChangeLanguage={false} />
      <main className="flex min-h-screen flex-row items-start justify-center p-20 bg-[rgb(245,245,245)]">
        <div className="h-full w-3/4">
          <div
            id="evaluasi"
            className="rounded-md border-0 p-4 bg-[rgb(255,255,255)]"
          >
            <h1 className="font-bold text-3xl mb-2">Evaluation</h1>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="w-full space-y-6"
              >
                <FormField
                  control={form.control}
                  name="eval1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Ceritakan pengalaman Anda menggunakan BEEXPERT selama
                        mengerjakan soal!
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Ketik jawabanmu di sini..."
                          className="min-h-[100px] w-full resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="eval2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Apa saja hal yang Anda sukai dan yang membedakan
                        BEEXPERT dengan AI chatbot pada umumnya?
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Ketik jawabanmu di sini..."
                          className="min-h-[100px] w-full resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="eval3"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Bagaimana pendapatmu terkait perbedaan pengalaman
                        belajar di kelas dengan BEEXPERT chatbot?
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Ketik jawabanmu di sini..."
                          className="min-h-[100px] w-full resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="eval4"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kritik dan saran</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Ketik jawabanmu di sini..."
                          className="min-h-[100px] w-full resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end mt-4">
                  <Button type="submit">Selesai</Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </main>
    </>
  );
}
