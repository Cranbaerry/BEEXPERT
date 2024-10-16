"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CounterClockwiseClockIcon } from "@radix-ui/react-icons";
import { Message } from "ai/react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { createClient } from "@/lib/supabase/client";
import { getUserData } from "@/lib/utils";
interface ChatDrawerProps {
  chatLog: Message[];
}

export default function ChatDrawer({ chatLog }: ChatDrawerProps) {
  const [open, setOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const [userName, setUserName] = useState<string | null>(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string>(
    "https://api.dicebear.com/6.x/initials/svg?seed=User",
  );

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setShowTooltip(false);
    }
  };

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  };

  useEffect(() => {
    if (open) {
      // Use setTimeout to ensure the drawer content has rendered
      setTimeout(scrollToBottom, 100);
    }
  }, [open]);

  useEffect(() => {
    const fetchUserData = async () => {
      const userData = await getUserData(supabase);
      if (userData) {
        const userName = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", userData.id)
          .single();
        if (userName) setUserName(userName.data?.full_name ?? "User");
        setProfilePictureUrl(
          userData.user_metadata?.profilePictureUrl ??
            `https://api.dicebear.com/6.x/initials/svg?seed=${userName.data?.full_name ?? "User"}`,
        );
      }
    };
    fetchUserData();
  }, [supabase]);

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <TooltipProvider>
        <Tooltip open={showTooltip}>
          <TooltipTrigger asChild>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className="chat__log p-3"
                aria-label="Open chat log"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onClick={() => setShowTooltip(false)}
              >
                <CounterClockwiseClockIcon className="h-5 w-5 text-black" />
              </Button>
            </SheetTrigger>
          </TooltipTrigger>
          <TooltipContent>Open chat log</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Chat Log</SheetTitle>
          <SheetDescription>View your recent conversations</SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-120px)] mt-4 pr-4">
          <div ref={scrollAreaRef}>
            {chatLog.map((message) => (
              <div key={message.id} className="flex items-start space-x-4 mb-4">
                <Avatar>
                  {message.role === "assistant" ? (
                    <AvatarImage src="/beexpert-logo.svg" alt="Assistant" />
                  ) : (
                    <AvatarImage src={profilePictureUrl} alt="User" />
                  )}
                  <AvatarFallback>
                    {message.role[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold capitalize">
                      {message.role === "assistant" ? "Bee" : userName}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(message.createdAt ?? "").toLocaleTimeString(
                        [],
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </span>
                  </div>
                  <p className="text-sm">{message.content}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
