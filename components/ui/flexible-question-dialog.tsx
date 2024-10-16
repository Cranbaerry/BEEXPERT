"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, XCircle } from "lucide-react"
import { CanvasRef, Workflow } from "@/lib/definitions"
import { QuestionInput } from "@/lib/definitions"
import { convertCanvasUriToFile, getUserData } from "@/lib/utils"
import { uploadImage } from "@/lib/supabase/storage"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Icons } from "@/components/ui/icons";

interface IDialogFinalAnswerProps {
    canvasRef: CanvasRef | null;
    workflow: Workflow | null;
}

export default function FlexibleQuestionDialog({ canvasRef, workflow }: IDialogFinalAnswerProps) {
    const [open, setOpen] = useState(false)
    const [selected, setSelected] = useState("")
    const [essayAnswers, setEssayAnswers] = useState<Record<string, string>>({})
    const [result, setResult] = useState<"correct" | "incorrect" | null>(null)
    const [answerSubmitted, setAnswerSubmitted] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const questionOptionsData = workflow?.options as QuestionInput

    const handleEssayChange = (id: string, value: string) => {
        setEssayAnswers(prev => ({ ...prev, [id]: value }))
    }

    const handleMultipleChoiceSelect = (optionId: string) => {
        if (answerSubmitted) return
        setSelected(optionId)
        setAnswerSubmitted(true)
        if (questionOptionsData && questionOptionsData.type === "multiple-choice") {
            if (optionId === questionOptionsData.correctAnswer) {
                setResult("correct")
            } else {
                setResult("incorrect")
            }
        }
    }

    const handleSubmit = async () => {
        setIsLoading(true)
        let answerData: { type: string; answer: string | Record<string, string> } = {
            type: "multiple-choice",
            answer: selected,
        }

        if (questionOptionsData && questionOptionsData.type === "essay") {
            answerData = {
                type: "essay",
                answer: essayAnswers,
            }
            setResult("correct")
            setAnswerSubmitted(true)
        }

        const user = await getUserData()
        if (!user) {
            toast.error("Error: User is not logged in.")
            setIsLoading(false)
            return
        }

        if (!questionOptionsData) {
            toast.error("Error: No question data available.")
            setIsLoading(false)
            return
        }

        const canvasDataUrl = canvasRef?.handleExport()
        const canvasFile = convertCanvasUriToFile(canvasDataUrl, user?.id)
        const supabase = createClient()
        const { imageUrl, error } = await uploadImage({
            storage: supabase.storage,
            file: canvasFile,
            bucket: "answers",
            folder: `${user.id}/workflow_${workflow?.id}`,
        })

        if (error) {
            toast.error("Error: Failed to upload image.")
            setIsLoading(false)
            return
        }

        await supabase.from("workflows_answers").insert([
            {
                workflow_id: workflow?.id,
                answer: answerData,
                image_url: imageUrl,
            }
        ])

        if (workflow?.next_workflow_id) {
            const { error } = await supabase.from("profiles").update({
                workflow_id: workflow?.next_workflow_id,
            }).eq("user_id", user.id).select()
            if (error) {
                toast.error("Error: Failed to update user profile.")
                setIsLoading(false)
                return
            }
        }

        setOpen(false)
        setIsLoading(false)
        resetQuestion()       
    }

    const isSubmitDisabled = () => {
        if (questionOptionsData && questionOptionsData.type === "multiple-choice") {
            return !answerSubmitted || isLoading
        } else {
            return questionOptionsData?.essayInputs?.some(input => !essayAnswers[input.id]) || isLoading
        }
    }

    const resetQuestion = () => {
        setSelected("")
        setEssayAnswers({})
        setResult(null)
        setAnswerSubmitted(false)
    }

    // useEffect(() => {
    //     if (open) {
    //         resetQuestion()
    //     }
    // }, [open])

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="default" disabled={!workflow?.options}>Submit Answer</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Answer submission</DialogTitle>
                    <DialogDescription>
                        {questionOptionsData ? (
                            questionOptionsData.type === "multiple-choice" ? "Choose the best answer." : "Provide your answers in the fields below."
                        ) : (
                            "Error: No question data available."
                        )}
                    </DialogDescription>
                </DialogHeader>
                {questionOptionsData ? (
                    <div className="py-2">
                        {questionOptionsData.type === "multiple-choice" ? (
                            <div className="grid grid-cols-2 gap-4">
                                {questionOptionsData.options?.map((option) => (
                                    <Button
                                        key={option.id}
                                        variant={selected === option.id ? "default" : "outline"}
                                        onClick={() => handleMultipleChoiceSelect(option.id)}
                                        disabled={answerSubmitted && selected !== option.id}
                                        className={`w-full ${answerSubmitted && option.id === questionOptionsData.correctAnswer
                                            ? "bg-green-500 hover:bg-green-600 text-white"
                                            : ""
                                            }`}
                                    >
                                        {option.text}
                                    </Button>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {questionOptionsData.essayInputs?.map((input) => (
                                    <div key={input.id}>
                                        <Label htmlFor={input.id} className="mb-2 block">
                                            {input.label}
                                        </Label>
                                        {input.type === "short" ? (
                                            <Input
                                                id={input.id}
                                                value={essayAnswers[input.id] || ""}
                                                onChange={(e) => handleEssayChange(input.id, e.target.value)}
                                                placeholder={`Enter your answer`}
                                                disabled={answerSubmitted}
                                            />
                                        ) : (
                                            <Textarea
                                                id={input.id}
                                                value={essayAnswers[input.id] || ""}
                                                onChange={(e) => handleEssayChange(input.id, e.target.value)}
                                                placeholder={`Enter your answer`}
                                                disabled={answerSubmitted}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="py-2">
                        <Alert variant="destructive">
                            <XCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>No question data available.</AlertDescription>
                        </Alert>
                    </div>
                )}
                {result && questionOptionsData && (
                    <Alert variant={result === "correct" ? "default" : "destructive"}>
                        {result === "correct" ? (
                            <CheckCircle2 className="h-4 w-4" />
                        ) : (
                            <XCircle className="h-4 w-4" />
                        )}
                        <AlertTitle>{result === "correct" ? "Correct!" : "Incorrect"}</AlertTitle>
                        <AlertDescription>
                            {result === "correct"
                                ? questionOptionsData.type === "multiple-choice"
                                    ? "Well done! You've selected the right answer."
                                    : "Thank you for your response. It has been submitted for review."
                                : `The correct answer is: ${questionOptionsData.options?.find(option => option.id === questionOptionsData.correctAnswer)?.text}`}
                        </AlertDescription>
                    </Alert>
                )}
                <DialogFooter className="flex justify-between">
                    {questionOptionsData && (
                        <>
                            {questionOptionsData.type === "essay" && (
                                <Button
                                    type="submit"
                                    onClick={handleSubmit}
                                    disabled={isSubmitDisabled()}
                                    variant="default"
                                >
                                    {isLoading ? (
                                        <>
                                            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                                            Saving..
                                        </>
                                    ) : (
                                        "Submit Answer"
                                    )}
                                </Button>
                            )}
                            {questionOptionsData.type === "multiple-choice" && answerSubmitted && (
                                <Button
                                    type="submit"
                                    onClick={handleSubmit}
                                    disabled={isSubmitDisabled()}
                                    variant="default"
                                >
                                    {isLoading ? (
                                        <>
                                            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                                            Saving..
                                        </>
                                    ) : (
                                        "Okay, take me to the next step"
                                    )}
                                </Button>
                            )}
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
