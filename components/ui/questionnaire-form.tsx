"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
} from "@/components/ui/alert-dialog";
import { ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons";
import { FieldErrors, FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { toast } from "sonner";
import { Icons } from "@/components/ui/icons";
import { isQuestionnaireFinished, insertQuestionnaireData } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import PersetujuanSection, {
  agreements,
} from "./questionnaire-section-agreement";
import DataDiriSection from "./questionnaire-section-user";
// import PertanyaanUmumSection from "./questionnaire-section-general";

export const formSchema = z.object({
  agreements: z
    .array(z.string())
    .refine((value) => value.length === agreements.length, {
      message: "Please agree to all the given terms and conditions.",
    }),
  fullName: z.string().min(1, { message: "Please enter your full name." }),
  // whatsappNumber: z.string().optional(),
  gender: z.enum(["male", "female"], {
    required_error: "Please select your gender.",
  }),
  profession: z
    .string()
    .min(1, { message: "Choose a profession from the available options." }),
  // educationLevel: z
  //   .string()
  //   .min(1, { message: "Select one of the educational level options." }),
  school: z
    .string()
    .min(1, { message: "Please fill in the school/institution." }),

  // question1: z.enum(["yes", "no"], {
  //   required_error: "Please select one option.",
  // }),
  // question2: z.enum(
  //   ["lack_understanding", "limited_understanding", "moderate_understanding", "extensive_understanding"],
  //   {
  //     required_error: "Please select one option.",
  //   },
  // ),
  // question3: z.enum(["yes", "no"], {
  //   required_error: "Please select one option.",
  // }),
  // question4: z.enum(["yes", "no"], {
  //   required_error: "Please select one option.",
  // }),
  // question5: z.array(z.string()).refine((value) => value.some((item) => item), {
  //   message: "Please select at least one of the options above.",
  // }),
  // question6: z.array(z.string()).refine((value) => value.some((item) => item), {
  //   message: "Please select at least one of the options above.",
  // }),
  // question7: z.array(z.string()).refine((value) => value.some((item) => item), {
  //   message: "Please select at least one of the options above.",
  // }),
  // question8: z.enum(["agree", "maybe", "disagree"], {
  //   required_error: "Please select one option.",
  // }),
  // question9: z.array(z.string()).refine((value) => value.some((item) => item), {
  //   message: "Please select at least one of the options above.",
  // }),
});

const sections = [
  { component: PersetujuanSection, class: "m:max-w-[425px]" },
  { component: DataDiriSection, class: "m:max-w-[425px]" },
  // { component: PertanyaanUmumSection, class: "sm:max-w-[500px]" },
];

export default function QuestionnaireForm() {
  const [activeSection, setActiveSection] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      // whatsappNumber: "",
      agreements: [],
      // question1: undefined,
      // question2: undefined,
      // question3: undefined,
      // question5: [],
      // question6: [],
      // question7: [],
      // question9: [],
      school: "",
      // educationLevel: "",
      profession: "",
    },
  });

  const handleNext = async (formData: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    //await new Promise((resolve) => setTimeout(resolve, 1000));
    const { error } = await insertQuestionnaireData(formData);

    if (error) {
      toast.error(error);
      setIsLoading(false);
      return;
    }

    toast.info(
      "Thank you for completing this questionnaire. Your data has been saved.",
    );
    setIsOpen(false);
    setIsLoading(false);
  };

  const handleNextError = async (formErrors: FieldErrors) => {
    switch (activeSection) {
      case 0:
        if (!formErrors.agreements) {
          setActiveSection(activeSection + 1);
          form.clearErrors();
          return;
        }
        break;
      case 1:
        const sectionErrors = [
          "fullName",
          "whatsappNumber",
          "gender",
          "profession",
          "educationLevel",
          "school",
        ].filter((field) => formErrors[field]);

        if (sectionErrors.length === 0) {
          setActiveSection(activeSection + 1);
          form.clearErrors();
          return;
        }
        break;
      case 2:
        // form.handleSubmit((data) => {
        //     setIsOpen(false);
        // });
        break;
      default:
        break;
    }

    toast.error("Please fill in all required fields.");
  };

  const handlePrevious = () => {
    if (activeSection > 0) {
      setActiveSection((prev) => prev - 1);
      console.log("Active:", activeSection);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setActiveSection(0);
    }
  };

  const renderSection = () => {
    const SectionComponent = sections[activeSection].component;
    return <SectionComponent />;
  };

  useEffect(() => {
    const checkQuestionnaire = async () => {
      const isFinished = await isQuestionnaireFinished();
      if (!isFinished) setIsOpen(true);
    };
    checkQuestionnaire();
  }, []);

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogContent className={sections[activeSection].class}>
        <FormProvider {...form}>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleNext, handleNextError)}>
              <ScrollArea className="max-h-[80vh] flex flex-col">
                <AlertDialogHeader></AlertDialogHeader>
                <div className="flex-grow overflow-auto">{renderSection()}</div>
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
                      {activeSection === sections.length - 1
                        ? "Finish"
                        : "Next"}
                      {isLoading ? (
                        <Icons.spinner className="ml-2 h-4 w-4 animate-spin" />
                      ) : (
                        <ChevronRightIcon className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </AlertDialogFooter>
              </ScrollArea>
            </form>
          </Form>
        </FormProvider>
      </AlertDialogContent>
    </AlertDialog>
  );
}
