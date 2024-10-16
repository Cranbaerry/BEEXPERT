"use client";

import { useFormContext } from "react-hook-form";
import { AlertDialogTitle } from "@/components/ui/alert-dialog";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";

export const question5 = [
  {
    id: "question5-1",
    label: "Assists in providing solutions to a problem.",
  },
  {
    id: "question5-2",
    label: "Explaining concepts that students find challenging.",
  },
  {
    id: "question5-3",
    label: "Providing ideas and suggestions.",
  },
  {
    id: "question5-4",
    label: "Assisting with assignments.",
  },
  {
    id: "question5-5",
    label: "Arranging presentation or teaching materials.",
  },
  {
    id: "question5-6",
    label: "Creating materials and practice questions.",
  },
  {
    id: "question5-7",
    label: "Others.",
  },
];

export const question6 = [
  {
    id: "question6-1",
    label: "Providing a sufficiently accurate answer.",
  },
  {
    id: "question6-2",
    label: "Instant response.",
  },
  {
    id: "question6-3",
    label: "Can accurately understand both image and text inputs.",
  },
  {
    id: "question6-4",
    label: "Others.",
  },
];

export const question7 = [
  {
    id: "question7-1",
    label: "Answers that can be a bit ambiguous sometimes.",
  },
  {
    id: "question7-2",
    label: "Insufficiently detailed answer.",
  },
  {
    id: "question7-3",
    label: "An erroneous response.",
  },
  {
    id: "question7-4",
    label: "Limitations in interaction.",
  },
  {
    id: "question7-5",
    label: "Others.",
  },
];

export const question9 = [
  {
    id: "question9-1",
    label:
      "A chatbot designed to prioritize providing stimuli over explicit answers.",
  },
  {
    id: "question9-2",
    label:
      "A chatbot capable of understanding and adapting its responses according to the specified learning objectives.",
  },
  {
    id: "question9-3",
    label:
      "A chatbot enabling active interactions, including voice and sketching functionalities.",
  },
  {
    id: "question9-4",
    label:
      "A chatbot capable of automatically assessing student comprehension, such as by administering pop quizzes.",
  },
  {
    id: "question9-5",
    label: "Others.",
  },
];

export default function PertanyaanUmumSection() {
  const form = useFormContext();
  return (
    <>
      <AlertDialogTitle className="mb-2">User&apos;s Characteristic Questions</AlertDialogTitle>
      <ScrollArea className="!mb-2 h-[calc(100vh-10rem)] sm:h-96 px-1">
        <p className="mb-2">
          Please respond to the following questions truthfully and correctly.
        </p>

        <FormField
          control={form.control}
          name="question1"
          render={({ field }) => (
            <FormItem className="mb-2">
              <FormLabel>
                Have you ever studied high school trigonometry?
              </FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-row space-y-1"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="yes" />
                    </FormControl>
                    <FormLabel className="font-normal">Yes</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0 ml-6">
                    <FormControl>
                      <RadioGroupItem value="no" />
                    </FormControl>
                    <FormLabel className="font-normal">No</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="question2"
          render={({ field }) => (
            <FormItem className="mb-2">
              <FormLabel>
                How well do you understand the topic of Trigonometry?
              </FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-row space-y-1"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="lack_understanding" />
                    </FormControl>
                    <FormLabel className="font-normal">Lack</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0 ml-6">
                    <FormControl>
                      <RadioGroupItem value="limited_understanding" />
                    </FormControl>
                    <FormLabel className="font-normal">Limited</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0 ml-6">
                    <FormControl>
                      <RadioGroupItem value="moderate_understanding" />
                    </FormControl>
                    <FormLabel className="font-normal">Moderate</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0 ml-6">
                    <FormControl>
                      <RadioGroupItem value="extensive_understanding" />
                    </FormControl>
                    <FormLabel className="font-normal">Extensive</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="question3"
          render={({ field }) => (
            <FormItem className="mb-2">
              <FormLabel>
                Have you ever used a chatbot (such as ChatGPT, Gemini, etc.) for academic purposes?
              </FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-row space-y-1"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="yes" />
                    </FormControl>
                    <FormLabel className="font-normal">Yes</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0 ml-6">
                    <FormControl>
                      <RadioGroupItem value="no" />
                    </FormControl>
                    <FormLabel className="font-normal">No</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="question4"
          render={({ field }) => (
            <FormItem className="mb-2">
              <FormLabel>
                Does the presence of AI chatbots accelerate your understanding of a concept?
              </FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-row space-y-1"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="yes" />
                    </FormControl>
                    <FormLabel className="font-normal">Yes</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0 ml-6">
                    <FormControl>
                      <RadioGroupItem value="no" />
                    </FormControl>
                    <FormLabel className="font-normal">No</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="question5"
          render={() => (
            <FormItem className="mb-2">
              <FormLabel>What is your objective for using a chatbot?</FormLabel>
              {question5.map((item) => (
                <FormField
                  key={item.id}
                  control={form.control}
                  name="question5"
                  render={({ field }) => {
                    return (
                      <FormItem
                        key={item.id}
                        className="flex flex-row items-center space-x-3 space-y-0"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(item.id)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...field.value, item.id])
                                : field.onChange(
                                    field.value?.filter(
                                      (value: string) => value !== item.id,
                                    ),
                                  );
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal leading-normal">
                          {item.label}
                        </FormLabel>
                      </FormItem>
                    );
                  }}
                />
              ))}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="question6"
          render={() => (
            <FormItem className="mb-2">
              <FormLabel>
                What&apos;s your favorite thing about AI chatbots?
              </FormLabel>
              {question6.map((item) => (
                <FormField
                  key={item.id}
                  control={form.control}
                  name="question6"
                  render={({ field }) => {
                    return (
                      <FormItem
                        key={item.id}
                        className="flex flex-row items-center space-x-3 space-y-0"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(item.id)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...field.value, item.id])
                                : field.onChange(
                                    field.value?.filter(
                                      (value: string) => value !== item.id,
                                    ),
                                  );
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal leading-normal">
                          {item.label}
                        </FormLabel>
                      </FormItem>
                    );
                  }}
                />
              ))}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="question7"
          render={() => (
            <FormItem className="mb-2">
              <FormLabel>
                What do you dislike about AI chatbots?
              </FormLabel>
              {question7.map((item) => (
                <FormField
                  key={item.id}
                  control={form.control}
                  name="question7"
                  render={({ field }) => {
                    return (
                      <FormItem
                        key={item.id}
                        className="flex flex-row items-center space-x-3 space-y-0"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(item.id)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...field.value, item.id])
                                : field.onChange(
                                    field.value?.filter(
                                      (value: string) => value !== item.id,
                                    ),
                                  );
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal leading-normal">
                          {item.label}
                        </FormLabel>
                      </FormItem>
                    );
                  }}
                />
              ))}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="question8"
          render={({ field }) => (
            <FormItem className="mb-2">
              <FormLabel>
                Do you agree that ChatGPT can be used as a student learning assistant?
              </FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-row space-y-1"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="agree" />
                    </FormControl>
                    <FormLabel className="font-normal">Agree</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0 ml-10">
                    <FormControl>
                      <RadioGroupItem value="maybe" />
                    </FormControl>
                    <FormLabel className="font-normal">Maybe</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0 ml-10">
                    <FormControl>
                      <RadioGroupItem value="disagree" />
                    </FormControl>
                    <FormLabel className="font-normal">Disagree</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="question9"
          render={() => (
            <FormItem className="mb-2">
              <FormLabel>
                What specific features or capabilities do you hope an AI chatbot would have as a learning assistant?
              </FormLabel>

              {question9.map((item) => (
                <FormField
                  key={item.id}
                  control={form.control}
                  name="question9"
                  render={({ field }) => {
                    return (
                      <FormItem
                        key={item.id}
                        className="flex flex-row items-center space-x-3 space-y-0"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(item.id)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...field.value, item.id])
                                : field.onChange(
                                    field.value?.filter(
                                      (value: string) => value !== item.id,
                                    ),
                                  );
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal leading-normal">
                          {item.label}
                        </FormLabel>
                      </FormItem>
                    );
                  }}
                />
              ))}
              <FormMessage />
            </FormItem>
          )}
        />
      </ScrollArea>
    </>
  );
}
