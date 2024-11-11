import { useEffect, useState, useCallback } from "react";
import { CallBackProps, STATUS, Step } from "react-joyride";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { useJoyride } from "@/contexts/JoyrideContext";
import { getUserData } from "@/lib/utils";

const Joyride = dynamic(
  () => import("react-joyride").then((mod) => mod.default),
  { ssr: false },
);

const JoyrideSteps = () => {
  const { isActive, setIsActive } = useJoyride();
  const [key, setKey] = useState(0);

  const [steps] = useState<Step[]>([
    {
      content: (
        <span className="text-sm">
          Please don&apos;t forget to turn on your microphone and use
          earphones/headsets for a smoother interaction with BEEXPERT.
        </span>
      ),
      locale: { skip: <strong aria-label="skip">Skip</strong> },
      placement: "center",
      target: "body",
      title: <div className="font-bold">Explore BEEXPERT features!</div>,
    },
    {
      content: (
        <span className="text-sm">
          You can switch the communication language with BEEXPERT to English by
          pressing the following button.
        </span>
      ),
      placement: "bottom",
      target: ".switch__lang",
      title: <div className="font-bold">Change Language</div>,
    },
    {
      content: (
        <span className="text-sm">
          View a brief video demonstration to learn how BEEXPERT works.
        </span>
      ),
      placement: "bottom",
      styles: {
        options: {
          width: 300,
        },
      },
      target: ".demo__project",
      title: <div className="font-bold">Demo Video</div>,
    },
    {
      content: (
        <span className="text-sm">
          Position the canvas just the way you like it!
        </span>
      ),
      placement: "right",
      styles: {
        options: {
          width: 300,
        },
      },
      target: ".tool__drag",
      title: <div className="font-bold">Tool: Drag</div>,
    },
    {
      content: (
        <span className="text-sm">
          Show your work for the problem using this pencil.
        </span>
      ),
      placement: "right",
      styles: {
        options: {
          width: 300,
        },
      },
      target: ".tool__pencil",
      title: <div className="font-bold">Tool: Pencil</div>,
    },
    {
      content: (
        <span className="text-sm">
          Use the eraser to correct your scribbles.
        </span>
      ),
      placement: "right",
      styles: {
        options: {
          width: 300,
        },
      },
      target: ".tool__eraser",
      title: <div className="font-bold">Tool: Eraser</div>,
    },
    {
      content: (
        <span className="text-sm">
          You can customize the pencil thickness as you desire.
        </span>
      ),
      placement: "right",
      styles: {
        options: {
          width: 300,
        },
      },
      target: ".tool__stroke_width",
      title: <div className="font-bold">Tool: Stroke Width</div>,
    },
    {
      content: (
        <span className="text-sm">Revert your drawing one step back.</span>
      ),
      placement: "right",
      styles: {
        options: {
          width: 300,
        },
      },
      target: ".tool__undo",
      title: <div className="font-bold">Tool: Undo</div>,
    },
    {
      content: (
        <span className="text-sm">Revert your drawing one step after.</span>
      ),
      placement: "right",
      styles: {
        options: {
          width: 300,
        },
      },
      target: ".tool__redo",
      title: <div className="font-bold">Tool: Redo</div>,
    },
    {
      content: (
        <span className="text-sm">
          Select the following option to enlarge the canvas.
        </span>
      ),
      placement: "right",
      styles: {
        options: {
          width: 300,
        },
      },
      target: ".tool__zoom_in",
      title: <div className="font-bold">Tool: Zoom In</div>,
    },
    {
      content: (
        <span className="text-sm">
          Select the following option to decrease the canvas dimensions.
        </span>
      ),
      placement: "right",
      styles: {
        options: {
          width: 300,
        },
      },
      target: ".tool__zoom_out",
      title: <div className="font-bold">Tool: Zoom Out</div>,
    },
    {
      content: (
        <span className="text-sm">
          Click the following toggle to mute/unmute your microphone.
        </span>
      ),
      placement: "top",
      styles: {
        options: {
          width: 300,
        },
      },
      target: ".tool__mute",
      title: <div className="font-bold">Tool: Mute/Unmute Microphone</div>,
    },
    {
      content: (
        <span className="text-sm">
          Click the following toggle to view your chat history with BEEXPERT.
        </span>
      ),
      placement: "top",
      styles: {
        options: {
          width: 300,
        },
      },
      target: ".chat__log",
      title: <div className="font-bold">Tool: Chat Log</div>,
    },
    {
      content: (
        <span className="text-sm">Just say hi to BEEXPERT to get started!</span>
      ),
      locale: {
        skip: <strong aria-label="skip">Skip</strong>,
        last: <strong aria-label="skip">Done</strong>,
      },
      placement: "center",
      target: "body",
      title: <div className="font-bold">You&apos;re ready to learn</div>,
    },
  ]);

  const resetJoyride = useCallback(() => {
    setIsActive(true);
    setKey((prevKey) => prevKey + 1);
  }, [setIsActive]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setIsActive(false);
    }
  };

  useEffect(() => {
    // Note: This is stupid but it's the simplest way I could think of to remount the component make the joyride work, open to suggestions
    if (isActive) {
      setKey((prevKey) => prevKey + 1);
    }
  }, [isActive]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("profiles-changes-joyride")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "profiles" },
        async (payload) => {
          const user = await getUserData();
          if (user && payload.new.user_id === user.id) {
            resetJoyride();
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [setIsActive, resetJoyride]);

  return (
    <Joyride
      key={key}
      callback={handleJoyrideCallback}
      continuous
      run={isActive}
      showProgress
      showSkipButton
      steps={steps}
      styles={{
        options: {
          zIndex: 10000,
          arrowColor: "#fff",
          backgroundColor: "#fff",
          primaryColor: "#000",
          textColor: "#000",
        },
      }}
    />
  );
};

export default JoyrideSteps;
