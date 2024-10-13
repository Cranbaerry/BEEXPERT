import { getUserData } from "@/lib/utils";
import AuthPageContent from "@/components/ui/auth-page-content";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Image from "next/legacy/image";

async function AuthenticationPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const supabase = createClient();
  const userData = await getUserData(supabase);
  const isAuthCodeError = "auth-code-error" in searchParams;
  if (userData) redirect("/pre-test");

  return (
    <div className="container relative flex h-screen flex-col items-center justify-center lg:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
        <div className="absolute inset-0">
          <Image
            src="/students.jpg"
            alt="Picture of students"
            objectFit="cover"
            layout="fill"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-50"></div>
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-base">
            An AI-based tutoring platform designed for high school students that allows them to ask questions directly through voice and images.
            </p>
            <footer className="text-xs italic">
              Part of &ldquo;Chatbot System with Retrieval
              Augmented Generation for Enhanced Self-learning Experience&rdquo;
              research by{" "}
              <a
                href="https://www.linkedin.com/in/angeline-mary-marchella/"
                target="_blank"
              >
                Angeline Mary Marchella
              </a>
              ,{" "}
              <a href="https://www.linkedin.com/in/naufal-h/" target="_blank">
                Naufal Hardiansyah
              </a>
              , dan{" "}
              <a
                href="https://www.linkedin.com/in/nathaniel-candra-b21288206/"
                target="_blank"
              >
                Nathaniel Candra
              </a>
              .
            </footer>
          </blockquote>
        </div>
      </div>

      <div className="flex h-full w-full flex-col justify-center px-6 md:px-8 lg:px-10">
        <AuthPageContent isAuthCodeError={isAuthCodeError} />
      </div>
    </div>
  );
}

export default AuthenticationPage;
