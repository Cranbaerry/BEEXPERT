"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ExitIcon } from "@radix-ui/react-icons";
import { LanguageCode } from "@/lib/definitions";
import { logout } from "@/app/logout/actions";
import { DialogDemo } from "./demo-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./alert-dialog";

interface IMainNavProps extends React.HTMLAttributes<HTMLElement> {
  enableChangeLanguage?: boolean;
  language?: LanguageCode;
  onChangeLanguage: ((language: LanguageCode) => void) | (() => void);
}

export function MainNav({
  className,
  enableChangeLanguage,
  // language,
  onChangeLanguage,
  ...props
}: IMainNavProps) {
  const [isLanguageEN, setIsLanguageEN] = useState(false);
  const [isAlertChangeLangOpen, setIsAlertChangeLangOpen] = useState(false);

  useEffect(() => {
    if (isLanguageEN) {
      onChangeLanguage("en-US");
    } else {
      onChangeLanguage("id-ID");
    }
  }, [isLanguageEN, onChangeLanguage]);

  const onChangeLanguageToggle = () => {
    setIsLanguageEN(!isLanguageEN);
    setIsAlertChangeLangOpen(true);
  };

  return (
    <nav
      className={cn("flex items-center space-x-4 lg:space-x-8", className)}
      {...props}
    >
      {enableChangeLanguage && (
        <div className="switch__lang flex items-center space-x-2">
          <Label htmlFor="lang-switch">Indonesia</Label>
          <Switch
            id="lang-switch"
            checked={isLanguageEN}
            onCheckedChange={onChangeLanguageToggle}
          />
          <Label htmlFor="lang-switch">English</Label>
        </div>
      )}
      <div className="demo__project text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
        <DialogDemo />
      </div>
      <form action={logout}>
        <button
          type="submit"
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary flex items-center space-x-4"
        >
          <ExitIcon className="h-4 w-4 mr-2" />
          Logout
        </button>
      </form>

      <AlertDialog
        open={isAlertChangeLangOpen}
        onOpenChange={setIsAlertChangeLangOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isLanguageEN ? "The communication language has been successfully changed!"
                : "Bahasa komunikasi berhasil diubah!"}
            </AlertDialogTitle>
            <AlertDialogDescription>
            Now, you can interact with BEEXPERT using {isLanguageEN ? "English" : "Indonesian"}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setIsAlertChangeLangOpen(false)}>
              Understood
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </nav>
  );
}
