"use client";

import { useEffect } from "react";
import { AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useFormContext } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getUserData } from "@/lib/utils";

export default function DataDiriSection() {
  const form = useFormContext();

  useEffect(() => {
    const fetchData = async () => {
      const user = await getUserData();
      if (user != null) {
        form.setValue("fullName", user.user_metadata.full_name ?? "");
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <AlertDialogTitle className="mb-2">Personal Information</AlertDialogTitle>
      <ScrollArea className="!mb-2 h-[calc(100vh-10rem)] sm:h-96 px-1">
        <p className="mb-2">
          Kindly fill in your personal details completely and correctly.
        </p>

        {/* Full Name */}
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => {
            return (
              <FormItem className="mb-2">
                <FormLabel>Full name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="John Doe"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e.target.value);
                    }}
                    required
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />

        {/* WhatsApp Number */}
        {/* <FormField
          control={form.control}
          name="whatsappNumber"
          render={({ field }) => {
            return (
              <FormItem className="mb-2">
                <FormLabel>Whatsapp number (optional)</FormLabel>
                <FormControl>
                  <Input placeholder="081234567890" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        /> */}

        {/* Gender */}
        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => {
            return (
              <FormItem className="mb-2 space-y-3">
                <FormLabel>Gender</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={(value) => {
                      field.onChange(value);
                    }}
                    defaultValue={field.value}
                    className="flex flex-row space-y-1"
                  >
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="male" />
                      </FormControl>
                      <FormLabel className="font-normal">Male</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0 ml-10">
                      <FormControl>
                        <RadioGroupItem value="female" />
                      </FormControl>
                      <FormLabel className="font-normal">Female</FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />

        {/* Profession */}
        <FormField
          control={form.control}
          name="profession"
          render={({ field }) => {
            return (
              <FormItem className="mb-2">
                <FormLabel>Profession</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                  }}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select one profession." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            );
          }}
        />

        {/* Education Level */}
        {/* <FormField
          control={form.control}
          name="educationLevel"
          render={({ field }) => {
            return (
              <FormItem className="mb-2">
                <FormLabel>Educational level</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                  }}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select one educational level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="elementary_school">
                      Elementary school
                    </SelectItem>
                    <SelectItem value="junior_high_school">
                      Junior high school
                    </SelectItem>
                    <SelectItem value="high_school">
                      High school
                    </SelectItem>
                    <SelectItem value="bachelor">
                      Bachelor degree
                    </SelectItem>
                    <SelectItem value="master">
                      Master degree
                    </SelectItem>
                    <SelectItem value="doctoral">
                      Doctoral degree
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            );
          }}
        /> */}

        {/* School */}
        <FormField
          control={form.control}
          name="school"
          render={({ field }) => {
            return (
              <FormItem className="mb-2">
                <FormLabel>School/institution</FormLabel>
                <FormControl>
                  <Input
                    placeholder="SMA xxx"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e.target.value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />
      </ScrollArea>
    </>
  );
}
