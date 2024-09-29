"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useRouter } from "next/navigation";
import { Header } from "@/components/ui/header";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { insert } from "./actions";
import { uploadImage } from "@/lib/supabase/storage/client";
import { convertCanvasUriToFile, getUserData } from "@/lib/utils";

const Canvas = dynamic(() => import('@/components/ui/canvas'), {
  ssr: false,
})

export default function PostTest() {
  const [selectedAnswer, setSelectedAnswer] = useState("")
  const [selectedOption, setSelectedOption] = useState<string>("")

  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const router = useRouter();
  const correctAnswer = "sin(30)"

  const options = [
    { letter: "A", opt: "sin(90)" },
    { letter: "B", opt: "cos(30)" },
    { letter: "C", opt: "sin(30)" },
    { letter: "D", opt: "cos(45)" },
  ]

  const canvasRef = useRef<{
    handleExport: () => string
  }>(null)

  const handleAnswer = (opt: string, letter: string) => {
    if(!submitted){
      setSelectedAnswer(opt)
      setSelectedOption(letter)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const user = await getUserData()
    const canvasDataUrl = canvasRef.current?.handleExport();
    
    const canvasFile = convertCanvasUriToFile(canvasDataUrl, user?.id)
    const { imageUrl, error } = await uploadImage({
      file: canvasFile,
      bucket: "post-test",
    });

    if (error) {
      console.error(error);
      setLoading(false)
      return;
    }

    const values = {
      option: selectedOption,
      answer: selectedAnswer,
      isCorrect: selectedAnswer === correctAnswer,
      imageUrl: imageUrl
    }
    insert(values)
    toast.success('Success', { description: 'Data berhasil disimpan!' })
    setSubmitted(true)
    setLoading(false)
  }

  const handleNext = () => {
    setLoading(true)
    router.push("/evaluasi")
    setLoading(false)
  }

  const getOptionStyle = (opt: string) => {
    if (!submitted) {
      return selectedAnswer === opt
        ? "bg-green-500 text-white border-green-500"
        : "bg-white text-black border-black"
    }
    if (opt === correctAnswer) {
      return "bg-green-500 text-white border-green-500"
    }
    if (selectedAnswer === opt && opt !== correctAnswer) {
      return "bg-red-500 text-white border-red-500"
    }
    return "bg-white text-black border-black"
  }

  return (
    <div className="flex flex-col min-h-screen bg-[rgb(245,245,245)]">
      <Header isFixed enableChangeLanguage={false} />
      <main className="flex flex-grow pt-20 px-10 pb-10 space-x-8">
        <div className="w-1/2 flex flex-col">
          <div id="pre-test" className="flex-grow rounded-md border-0 p-4 bg-white">
            <h1 className="font-bold text-3xl mb-4">Post-Test</h1>
            <form onSubmit={handleSubmit} className="flex flex-col h-full">
              <fieldset className="mb-4 flex-grow">
                <legend className="text-lg mb-2">
                  Setelah kamu belajar dengan BEEXPERT, jawablah pertanyaan berikut tanpa menggunakan kalkulator dan bantuan apapun.
                </legend>
                <div className="flex items-center justify-center mt-2 mb-2">
                  <Image
                    src="/soal/post-test.png"
                    alt="Pre-test Question"
                    width={504}
                    height={78}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 mt-8 mb-10" role="radiogroup">
                  {options.map(({ letter, opt }) => (
                    <button
                      key={letter}
                      type="button"
                      onClick={() => handleAnswer(opt, letter)}
                      className={`w-full text-left px-4 py-2 rounded-md border ${getOptionStyle(
                        opt
                      )} transition-colors duration-200`}
                      role="radio"
                      aria-checked={selectedAnswer === opt}
                      disabled={submitted}
                    >
                      <span className="inline-block w-6 h-6 mr-2 rounded-full border-2 border-current text-center leading-5">
                        {letter}
                      </span>
                      {opt}
                    </button>
                  ))}
                </div>
              </fieldset>
              {submitted && (
                <div className="mb-4">
                  {selectedAnswer === correctAnswer ? (
                    <p className="text-green-600" role="alert">
                      Selamat, jawabanmu benar! Yuk, belajar lebih dalam lagi dengan BEEXPERT di halaman selanjutnya!
                    </p>
                  ) : (
                    <p className="text-red-600" role="alert">
                      Jawabanmu kurang tepat. Jawaban yang benar adalah {correctAnswer}. Yuk, mulai belajar dengan BEEXPERT di halaman selanjutnya!
                    </p>
                  )}
                </div>
              )}
              <div className="mt-auto mb-[55px]">
                {!submitted ? (
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={!selectedAnswer || submitted || loading}
                  >
                    Submit
                  </Button>
                ) : (
                  <Button
                    type="button"
                    className="w-full"
                    onClick={handleNext}
                    disabled={loading}
                  >
                    Next
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>
        <div className="w-1/2">
          <Canvas backgroundColor={'#FFFFFF'} canvasRef={canvasRef} questionsSheetImageSource={null}/>
        </div>
      </main>
    </div>
  )
}