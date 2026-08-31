import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks";
import { Button, Spinner } from "@/components/ui";
import { Logotype } from "@/components";

export function WelcomePage() {
  const navigate = useNavigate();
  const { setSessionToken } = useAuth();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const startDeviceLogin = async (mode: "signin" | "signup") => {
    setPending(true);
    setError("");
    try {
      const result = await window.electronAPI?.auth?.startDeviceLogin(mode);
      if (result?.token) {
        await setSessionToken(result.token, result.expiresIn);
        navigate("/", { replace: true });
        return;
      }
      setError("Sign in timed out or was cancelled. Please try again.");
    } catch {
      setError("Something went wrong while signing in. Please try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-10 bg-white px-6 text-center select-none dark:bg-gray-950">
      <title>Welcome - Escruta</title>
      <div className="flex flex-col items-center gap-4">
        <Logotype className="h-8 w-auto fill-black dark:fill-white" />
        <p className="max-w-sm text-balance text-gray-600 dark:text-gray-400">
          Your notebooks, sources, and AI-powered insights — all in one place.
        </p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-3">
        <Button
          onClick={() => startDeviceLogin("signin")}
          disabled={pending}
          className="w-full"
          icon={pending ? <Spinner size={16} className="text-white" /> : null}
        >
          {pending ? "Waiting for sign in…" : "Sign in"}
        </Button>

        <button
          type="button"
          onClick={() => startDeviceLogin("signup")}
          disabled={pending}
          className="text-sm font-medium text-blue-500 transition-colors hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Create an account
        </button>

        {error && (
          <p className="text-sm text-red-500" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
