import { useState, useEffect } from 'react';
import { CallBackProps, STATUS, Step } from "react-joyride";
import dynamic from "next/dynamic";
import { isNewUser, isQuestionnaireFinished } from "@/lib/utils";

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
    const handleJoyrideCallback = (data: CallBackProps) => {
        const { status } = data;
        const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

        if (finishedStatuses.includes(status)) {
            setState({ run: false, steps });
        }
    };

    useEffect(() => {
        const fetchNewUser = async () => {
            const [newUser, isFinished] = await Promise.all([isNewUser(), isQuestionnaireFinished()]);
            if (newUser && isFinished) {
                setState({ run: true, steps });
            }
        };

        fetchNewUser().catch(console.error);
    }, [steps]);

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
                    <h2 className="font-bold">
                        Let&apos;s explore the features available on BEEXPERT!
                    </h2>
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
                title: <h2 className="font-bold">Change Language</h2>,
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
                title: <h2 className="font-bold">Demo Video</h2>,
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
                title: <h2 className="font-bold">Tool: Drag</h2>,
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
                title: <h2 className="font-bold">Tool: Pencil</h2>,
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
                title: <h2 className="font-bold">Tool: Eraser</h2>,
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
                title: <h2 className="font-bold">Tool: Stroke Width</h2>,
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
                title: <h2 className="font-bold">Tool: Undo</h2>,
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
                title: <h2 className="font-bold">Tool: Redo</h2>,
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
                title: <h2 className="font-bold">Tool: Zoom In</h2>,
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
                title: <h2 className="font-bold">Tool: Zoom Out</h2>,
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
                title: <h2 className="font-bold">Tool: Mute/Unmute Microphone</h2>,
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
                title: <h2 className="font-bold">Tool: Chat Log</h2>,
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
                title: <h2 className="font-bold">You&apos;re Ready to Learn</h2>,
            },
        ],
    });

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

JoyrideSteps.name = "JoyrideSteps";
export default JoyrideSteps;