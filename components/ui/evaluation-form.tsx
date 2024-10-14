"use client";

import { useForm, FormProvider, FieldErrors } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useState } from "react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons";
import { Icons } from "@/components/ui/icons";
import { ScrollArea } from "@/components/ui/scroll-area";

const commonValidationSchema = z.array(
  z.enum(["1", "2", "3", "4", "5"], {
    errorMap: (issue) => {
      if (issue.code === "invalid_enum_value") {
        return { message: "Please select an option for each statement." };
      }
      return { message: issue.message ?? "" };
    },
  })
).nonempty({ message: "Please answer all the statements." });

export const surveySchema = z.object({
  initiatingConversation: commonValidationSchema,
  communicationEffort: commonValidationSchema,
  contentRelevance: commonValidationSchema,
  responseClarity: commonValidationSchema,
  gracefulBreakdown: commonValidationSchema,
  perceivedSpeed: commonValidationSchema,
  perceivedPrivacy: commonValidationSchema,
  selfEfficacy: commonValidationSchema,
  criticsmAndSuggestions: z.array(z.string().nonempty()),
});

const sections = [
  {
    title: "Initiating Conversation",
    key: "initiatingConversation",
    statements: [
      {
        statement: "I can easily understand how to start the interaction with the chatbot.",
        translation: "Saya mudah memahami cara untuk memulai interaksi dengan chatbot.",
      },
      {
        statement: "When I encounter a problem and have questions to ask, I find it easy to start a conversation with a chatbot.",
        translation: "Saat mendapatkan soal dan memiliki pertanyaan untuk disampaikan, saya mudah memahami cara untuk memulai percakapan dengan chatbot.",
      },
      {
        statement: "I can easily start conversations with the chatbot.",
        translation: "Saya mudah memulai percakapan dengan chatbot.",
      },
      {
        statement: "I find it easy to communicate with the chatbot.",
        translation: "Saya mudah bercakapan dengan chatbot.",
      },
      {
        statement: "The chatbot was easy to access.",
        translation: "Chatbot mudah diakses.",
      },
      {
        statement: "The chatbot features were easily detectable.",
        translation: "Fitur-fitur pada chatbot mudah untuk dideteksi.",
      },
      {
        statement: "Communicating with the chatbot was clear.",
        translation: "Komunikasi saya dengan chatbot jelas.",
      },
      {
        statement: "I was immediately made aware of what information the chatbot can give me.",
        translation: "Saya dapat dengan mudah memahami informasi yang dapat diberikan chatbot.",
      },
      {
        statement: "It is clear to me early on about what the chatbot can do, such as explaining the steps to solve a problem and understanding the writing/scribbles written on a digital whiteboard.",
        translation: "Saya dapat dengan jelas memahami apa yang dapat dilakukan chatbot, seperti menjelaskan langkah-langkah penyelesaian soal dan memahami tulisan/coretan yang ditulis di papan digital.",
      },
    ],
  },
  {
    title: "Communication Effort",
    key: "communicationEffort",
    statements: [
      {
        statement: "I had to rephrase my input multiple times for the chatbot to be able to help me.",
        translation: "Saya harus menyatakan maksud saya lebih dari sekali supaya chatbot dapat membantu saya.",
      },
      {
        statement: "I need to choose my words carefully when communicating with the chatbot.",
        translation: "Saya perlu berhati-hati dalam ungkapan saat berkomunikasi dengan chatbot.",
      },
      {
        statement: "I can easily tell the chatbot what I would like it to do.",
        translation: "Saya dapat dengan mudah memberi tahu chatbot apa yang saya inginkan.",
      },
    ],
  },
  {
    title: "Content Relevance",
    key: "contentRelevance",
    statements: [
      {
        statement: "The interaction with the chatbot feels like a natural everyday conversation.",
        translation: "Interaksi dengan chatbot terasa seperti percakapan sehari-hari.",
      },
      {
        statement: "The chatbot can keep up with the flow and intention of the chat.",
        translation: "Chatbot dapat terus mengikuti arah dan maksud percakapan.",
      },
      {
        statement: "The chatbot maintained relevant conversation.",
        translation: "Chatbot dapat mempertahankan percakapan yang relevan.",
      },
      {
        statement: "The chatbot guided me to the relevant answers.",
        translation: "Chatbot memandu saya ke jawaban yang relevan.",
      },
      {
        statement: "When explaining the steps I didn't understand, I felt that the chatbot could understand my meaning.",
        translation: "Saat menjelaskan langkah yang tidak saya pahami, saya merasa bahwa chatbot tersebut dapat memahami maksud saya.",
      },
      {
        statement: "The chatbot was able to guide me to an accurate and correct answer.",
        translation: "Chatbot mampu membimbing saya untuk memperoleh jawaban yang benar dan akurat.",
      },
      {
        statement: "I find that the chatbot understands what I want and helps me achieve my goal.",
        translation: "Saya menemukan bahwa chatbot memahami apa yang saya inginkan dan membantu mencapai tujuan saya.",
      },
      {
        statement: "The chatbot gave relevant information during the whole conversation.",
        translation: "Chatbot memberikan informasi yang relevan selama proses percakapan berlangsung.",
      },
      {
        statement: "The chatbot is good at providing me with a helpful response at any point of the process of solving problems.",
        translation: "Chatbot baik dalam memberi saya respons yang membantu di setiap tahapan pengerjaan soal.",
      },
      {
        statement: "The chatbot provided relevant information as and when I needed it.",
        translation: "Chatbot menyediakan informasi yang relevan saat saya membutuhkan.",
      },
      {
        statement: "I feel like the chatbot’s responses were accurate.",
        translation: "Saya merasa respons chatbot akurat.",
      },
      {
        statement: "I believe that the chatbot only states reliable information.",
        translation: "Saya percaya bahwa chatbot hanya menyatakan informasi yang dapat diandalkan.",
      },
      {
        statement: "It appeared that the chatbot provided accurate and reliable information.",
        translation: "Sepertinya chatbot tersebut memberikan informasi yang akurat dan dapat diandalkan.",
      },
    ],
  },
  {
    title: "Response Clarity",
    key: "responseClarity",
    statements: [
      {
        statement: "The amount of information I received is exactly as needed.",
        translation: "Jumlah informasi yang saya terima tepat sesuai kebutuhan.",
      },
      {
        statement: "The chatbot only gives me the information I need at the right time.",
        translation: "Chatbot hanya memberi saya informasi yang saya butuhkan pada saat yang tepat.",
      },
      {
        statement: "I felt the chatbot’s responses clear.",
        translation: "Saya merasakan respons chatbot jelas.",
      },
      {
        statement: "The chatbot only states understandable answers.",
        translation: "Chatbot hanya memberikan jawaban yang bisa dimengerti.",
      },
      {
        statement: "The chatbot’s responses were easy to understand.",
        translation: "Respons chatbot mudah dipahami.",
      },
    ],
  },
  {
    title: "Graceful Breakdown",
    key: "gracefulBreakdown",
    statements: [
      {
        statement: "The chatbot can deal with situations where the conversation is unclear.",
        translation: "Chatbot dapat mengelola situasi di mana percakapan tidak jelas.",
      },
      {
        statement: "The chatbot provides a clear explanation when it is unable to assist.",
        translation: "Chatbot menjelaskan dengan baik jika tidak dapat membantu.",
      },
      {
        statement: "When the chatbot encounters a problem, such as providing incorrect answers or having difficulty understanding the questions asked, it responds appropriately.",
        translation: "Ketika chatbot menghadapi masalah, seperti kekeliruan saat menjawab atau kesulitan memahami pertanyaan yang diajukan, ia merespons dengan tepat.",
      },
    ],
  },
  {
    title: "Perceived Speed",
    key: "perceivedSpeed",
    statements: [
      {
        statement: "The chatbot responds in a reasonable time for me.",
        translation: "Chatbot memberikan tanggapan dalam batas waktu yang wajar bagi saya.",
      },
      {
        statement: "I felt that my waiting time for a response from the chatbot was short.",
        translation: "Waktu tunggu saya untuk mendapat respons dari chatbot terasa singkat.",
      },
    ],
  },
  {
    title: "Perceived Privacy",
    key: "perceivedPrivacy",
    statements: [
      {
        statement: "I feel that my data is protected.",
        translation: "Saya merasa data saya dilindungi.",
      },
      {
        statement: "I believe the chatbot can inform me if there is a privacy issue.",
        translation: "Saya percaya chatbot dapat menginformasikan saya jika terdapat permasalahan privasi.",
      },
      {
        statement: "I believe that the chatbot protects my privacy well.",
        translation: "Saya percaya bahwa chatbot menjaga privasi saya dengan baik.",
      },
    ],
  },
  {
    title: "Self-efficacy",
    key: "selfEfficacy",
    statements: [
      {
        statement: "I feel more confident in completing tasks after interacting with a chatbot.",
        translation: "Saya merasa lebih percaya diri dalam menyelesaikan tugas setelah berinteraksi dengan chatbot.",
      },
      {
        statement: "The chatbot helps me to better understand the steps I need to take to achieve my goals.",
        translation: "Chatbot membantu saya untuk lebih memahami langkah-langkah yang perlu saya ambil untuk mencapai tujuan saya.",
      },
      {
        statement: "After using the chatbot, I feel more capable of overcoming the challenges I face.",
        translation: "Setelah menggunakan chatbot, saya merasa lebih mampu mengatasi tantangan yang saya hadapi.",
      },
      {
        statement: "The chatbot provides support that makes me feel more confident in making decisions.",
        translation: "Chatbot memberikan dukungan yang membuat saya merasa lebih yakin dalam mengambil keputusan.",
      },
      {
        statement: "Interacting with the chatbot encourages me to try new things I was previously hesitant to do.",
        translation: "Interaksi dengan chatbot mendorong saya untuk mencoba hal-hal baru yang sebelumnya saya ragu untuk lakukan.",
      },
      {
        statement: "I feel more skilled in using technology after interacting with the chatbot.",
        translation: "Saya merasa lebih terampil dalam menggunakan teknologi setelah berinteraksi dengan chatbot.",
      },
      {
        statement: "I feel that the information provided by the chatbot reinforces my self-confidence.",
        translation: "Saya merasa bahwa informasi yang diberikan oleh chatbot memperkuat keyakinan saya dalam kemampuan diri.",
      },
    ],
  },
  {
    title: "Criticsm and Suggestions",
    key: "criticsmAndSuggestions",
    statements: [
      {
        statement: "Any other suggestions or criticisms for the chatbot?",
        translation: "Ada saran lain atau kritik untuk chatbot?",
      },
    ],
  }
];

export default function EvaluationForm() {
  const [isOpen, setIsOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSection, setActiveSection] = useState(0);

  const form = useForm<z.infer<typeof surveySchema>>({
    resolver: zodResolver(surveySchema),
    defaultValues: {
      initiatingConversation: Array(sections[0].statements.length).fill(""),
      communicationEffort: Array(sections[1].statements.length).fill(""),
      contentRelevance: Array(sections[2].statements.length).fill(""),
      responseClarity: Array(sections[3].statements.length).fill(""),
      gracefulBreakdown: Array(sections[4].statements.length).fill(""),
      perceivedSpeed: Array(sections[5].statements.length).fill(""),
      perceivedPrivacy: Array(sections[6].statements.length).fill(""),
      selfEfficacy: Array(sections[7].statements.length).fill(""),
      criticsmAndSuggestions: Array(sections[8].statements.length).fill(""),
    },
  });

  const handleSubmit = async (data: z.infer<typeof surveySchema>) => {
    console.log(data);
    setIsLoading(true);
    try {
      toast.success("Survey submitted successfully!");
      setIsOpen(false);
    } catch (error) {
      toast.error("Failed to submit survey.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleError = (formErrors: FieldErrors) => {
    const currentSectionKey = sections[activeSection].key;
    if (!formErrors[currentSectionKey]) {
      //setActiveSection(activeSection + 1);
      setActiveSection((prev) => Math.min(prev + 1, sections.length - 1));
      form.clearErrors();
      return;
    }

    toast.error("Please fill in all required fields.");
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
  };

  const handlePrevious = () => {
    if (activeSection > 0) {
      setActiveSection(activeSection - 1);
    }
  };

  const currentSection = sections[activeSection];

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="sm:max-w-[600px]">
        <AlertDialogHeader>
          <h2 className="text-xl font-bold">User Feedback</h2>
          Thank you for trying out our app! We would like to hear your feedback on your experience with the platform. 😇❤️
        </AlertDialogHeader>
        <FormProvider {...form}>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit, handleError)}>
              <h4 className="scroll-m-20 border-b pb-2 text-lg font-semibold tracking-tight transition-colors mb-2">
                {currentSection.title}
              </h4>
              {currentSection.key === "criticsmAndSuggestions" ? (
                currentSection.statements.map((item, index) => (
                  <>
                    <FormField
                      key={`${currentSection.key}-${index}`}
                      control={form.control}
                      name={`${currentSection.key}.${index}` as keyof z.infer<typeof surveySchema>}
                      render={({ field }) => (
                        <FormItem className="mb-4">
                          <FormLabel>
                            {item.statement}
                          </FormLabel>
                          <p className="text-sm text-gray-500">{item.translation}</p>
                          <FormControl className="h-full">
                            <textarea
                              {...field}
                              className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary h-full"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                ))
              ) : (
                <ScrollArea className="!mb-4 h-[calc(100vh-10rem)] sm:h-96 px-1">
                  {currentSection.statements.map((item, index) => (
                    <FormField
                      key={`${currentSection.key}-${index}`}
                      control={form.control}
                      name={`${currentSection.key}.${index}` as keyof z.infer<typeof surveySchema>}
                      render={({ field }) => (
                        <FormItem className="mb-4">
                          <FormLabel>
                            {index + 1}. {item.statement}
                          </FormLabel>
                          <p className="text-sm text-gray-500">{item.translation}</p>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              value={field.value[index]}
                              className="flex flex-row space-x-4 mt-2"
                            >
                              {["1", "2", "3", "4", "5"].map((value) => (
                                <FormItem
                                  key={`${currentSection.key}-${index}-${value}`}
                                  className="flex items-center space-x-2"
                                >
                                  <FormControl>
                                    <RadioGroupItem value={value} />
                                  </FormControl>
                                  <FormLabel className="font-normal">{value}</FormLabel>
                                </FormItem>
                              ))}
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </ScrollArea>
              )}
              <AlertDialogFooter className="flex-col items-center sm:flex-row sm:justify-between">
                <div className="flex w-full justify-between items-center">
                  <Button
                    onClick={handlePrevious}
                    type="button"
                    disabled={activeSection === 0 || isLoading}
                    variant="outline"
                    size="sm"
                  >
                    <ChevronLeftIcon className="mr-2 h-4 w-4" />
                    Previous
                  </Button>
                  <div className="flex space-x-2">
                    {sections.map((_, index) => (
                      <div
                        key={index}
                        className={`h-2 w-2 rounded-full ${index === activeSection ? "bg-primary" : "bg-gray-300"}`}
                      />
                    ))}
                  </div>
                  <Button type="submit" size="sm" disabled={isLoading}>
                    {activeSection === sections.length - 1 ? "Finish" : "Next"}
                    {isLoading ? (
                      <Icons.spinner className="ml-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ChevronRightIcon className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </AlertDialogFooter>
            </form>
          </Form>
        </FormProvider>
      </AlertDialogContent>
    </AlertDialog>
  );
}
