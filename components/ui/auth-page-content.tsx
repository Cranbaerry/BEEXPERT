"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { toast } from "sonner";
import Image from "next/legacy/image";
import { useRouter } from "next/navigation";
import { signInWithPassword, signInWithOAuth, signUp } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/ui/icons";

function AuthPageContent({ isAuthCodeError }: { isAuthCodeError: boolean }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [formMode, setFormMode] = useState<"SignUp" | "SignIn">("SignIn");
  const [currentFormMode, setCurrentFormMode] = useState(formMode);

  const toggleFormMode = () => {
    setFormMode((prevMode) => (prevMode === "SignUp" ? "SignIn" : "SignUp"));
  };

  // Update form mode with animation
  useEffect(() => {
    if (formMode !== currentFormMode) {
      setIsLoading(true);
      const timeoutId = setTimeout(() => {
        setCurrentFormMode(formMode);
        setIsLoading(false);
      }, 300); // Animation duration
      return () => clearTimeout(timeoutId);
    }
  }, [formMode, currentFormMode]);

  useEffect(() => {
    const handleCheckAuthCodeError = async () => {
      if (isAuthCodeError) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        toast.error("Error", {
          description: "Kode autentikasi tidak valid.",
        });
      }
    };
    handleCheckAuthCodeError();
  }, [isAuthCodeError]);

  const handleSignUp = useCallback(
    async (event: React.SyntheticEvent) => {
      event.preventDefault();
      setIsLoading(true);

      const form = event.target as HTMLFormElement;
      const formData = new FormData(form);
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;

      const { data, error } = await signUp({ email, password });
      setIsLoading(false);

      if (error) {
        toast.error(error);
        return;
      }

      toast.success("Successfully signed up", {
        description: `Hello ${data?.user?.email ?? "Guest"}`,
      });
      router.push("/playground");
    },
    [router],
  );

  const handleSignIn = useCallback(
    async (event: React.SyntheticEvent) => {
      event.preventDefault();
      setIsLoading(true);

      const form = event.target as HTMLFormElement;
      const formData = new FormData(form);
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;

      const { data, error } = await signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error);
        setIsLoading(false);
        return;
      }

      toast.success("Successfully logged in", {
        description: `Hello ${data?.user?.email ?? "Guest"}`,
      });
      router.push("/playground");
    },
    [router],
  );

  const handleOAuthLogin = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await signInWithOAuth();

    if (error) {
      toast.error(error);
      setIsLoading(false);
      return;
    }

    if (!data?.url) {
      toast.error("Oops! Something went wrong, please try again later");
      setIsLoading(false);
      return;
    }

    toast.info("Redirecting", {
      description: "You are now being redirected..",
    });
    router.push(data.url);
  }, [router]);

  return (
    <div className="lg:p-8">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <Link
          href="#"
          onClick={toggleFormMode}
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "absolute right-4 top-4 md:right-8 md:top-8",
          )}
        >
          {formMode === "SignUp" ? "Login" : "Sign Up"}
        </Link>
        <>
          <div className="flex flex-col items-center justify-center space-y-2">
            <Image
              src="/beexpert-logo.svg"
              alt="BEEXPERT Logo"
              width={80}
              height={82.5}
              priority
            />
            <Image
              src="/beexpert-name.svg"
              alt="BEEXPERT"
              width={170}
              height={19}
              priority
            />
          </div>

          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              {currentFormMode === "SignUp"
                ? "Create a new account"
                : "Login with email"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {currentFormMode === "SignUp"
                ? "Enter your email to create an account"
                : "Enter your credential to continue"}
            </p>
          </div>

          <div
            className={cn(
              "grid gap-6 transition-opacity duration-300 ease-in-out",
              isLoading ? "opacity-50" : "opacity-100",
            )}
          >
            <form
              onSubmit={
                currentFormMode === "SignUp" ? handleSignUp : handleSignIn
              }
            >
              <div className="grid gap-2">
                <div className="grid gap-2">
                  <Label className="sr-only" htmlFor="email">
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    placeholder="name@example.com"
                    type="email"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect="off"
                    disabled={isLoading}
                  />
                  <Input
                    id="password"
                    name="password"
                    placeholder="Password"
                    type="password"
                    autoCapitalize="none"
                    autoComplete="password"
                    autoCorrect="off"
                    disabled={isLoading}
                  />
                </div>
                <Button disabled={isLoading}>
                  {isLoading && (
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {currentFormMode === "SignUp" ? "Sign Up" : "Login"}
                </Button>
              </div>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  {currentFormMode === "SignUp" ? "Or sign up with" : "Or login with"}
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              type="button"
              disabled={isLoading}
              onClick={handleOAuthLogin}
            >
              {isLoading ? (
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Icons.google className="mr-1 h-4 w-4" />
              )}{" "}
              Google
            </Button>
          </div>
        </>
        <p className="px-8 text-center text-sm text-muted-foreground">
          By using this platform, you agree with the {" "}
          <Link
            href="#"
            className="underline underline-offset-4 hover:text-primary"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="#"
            className="underline underline-offset-4 hover:text-primary"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

export default AuthPageContent;
