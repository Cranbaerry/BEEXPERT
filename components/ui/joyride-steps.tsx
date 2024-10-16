import { useState, useEffect } from 'react';
import { CallBackProps, STATUS, Step } from "react-joyride";
import dynamic from "next/dynamic";
import { isNewUser, isQuestionnaireFinished } from "@/lib/utils";
import { getUserData } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface State {
    run: boolean;
    steps: Step[];
}
const Joyride = dynamic(
    () => import("react-joyride").then((mod) => mod.default),
    {
        ssr: false,
    },
);

const JoyrideSteps = () => {
    const supabase = createClient();
    const handleProfileInsertion = async (payload: { new: { user_id: string } }) => {
        const user = await getUserData();
        if (!user) return;
        if (payload.new.user_id === user.id) {
            setState({ run: true, steps });
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const channel = supabase
        .channel('profiles-changes-joyride')
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'profiles',
            },
            handleProfileInsertion
        )
        .subscribe()

    const handleJoyrideCallback = (data: CallBackProps) => {
        const { status } = data;
        const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

        if (finishedStatuses.includes(status)) {
            setState({ run: false, steps });
        }
    };

    const [{ run, steps }, setState] = useState<State>({
        run: false,
        steps: [
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
                title: (
                    <div className="font-bold">
                        Explore BEEXPERT features!                     
                    </div>
                ),
            },
            {
                content: (
                    <span className="text-sm">
                        You can switch the communication language with BEEXPERT to English
                        by pressing the following button.
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
                    <span className="text-sm">
                        Just say hi to BEEXPERT to get started!
                    </span>
                ),
                locale: {
                    skip: <strong aria-label="skip">Skip</strong>,
                    last: <strong aria-label="skip">Done</strong>,
                },
                placement: "center",
                target: "body",
                title: <div className="font-bold">You&apos;re ready to learn</div>,
            },
        ],
    });

    useEffect(() => {
        const fetchNewUser = async () => {
            const [newUser, isFinished] = await Promise.all([isNewUser(), isQuestionnaireFinished()]);
            if (newUser && isFinished) {
                setState({ run: true, steps });
            }
        };

        fetchNewUser().catch(console.error);
    }, [steps]);

    return (
        <Joyride
            callback={handleJoyrideCallback}
            continuous
            run={run}
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

// JoyrideSteps.name = "JoyrideSteps";
export default JoyrideSteps;