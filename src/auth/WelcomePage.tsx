import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks";
import { Button, Spinner, TextField } from "@/components/ui";
import { Logotype } from "@/components";
import { BACKEND_BASE_URL } from "@/config";

type Step = "email" | "code" | "name";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function parseError(response: Response): Promise<string> {
  try {
    const data = await response.json();
    if (typeof data?.message === "string" && data.message) return data.message;
    if (typeof data?.detail === "string" && data.detail) return data.detail;
  } catch {
    // ignore, fall through to generic message
  }
  return "";
}

export function WelcomePage() {
  const navigate = useNavigate();
  const { setSessionToken } = useAuth();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const finishWithSession = async (token: string, expiresIn?: number) => {
    await setSessionToken(token, expiresIn);
    navigate("/", { replace: true });
  };

  const requestCode = async (targetEmail: string) => {
    setPending(true);
    setError("");
    try {
      const response = await fetch(new URL("/auth/request-code", BACKEND_BASE_URL), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail }),
      });
      if (!response.ok) {
        const detail = await parseError(response);
        setError(detail || "Could not send the verification code. Please try again.");
        return false;
      }
      return true;
    } catch {
      setError("Could not reach the server. Please check your connection and try again.");
      return false;
    } finally {
      setPending(false);
    }
  };

  const handleEmailSubmit = async () => {
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setError("Please enter a valid email address.");
      return;
    }
    setEmail(trimmed);
    const ok = await requestCode(trimmed);
    if (ok) {
      setCode("");
      setStep("code");
    }
  };

  const handleCodeSubmit = async () => {
    const trimmedCode = code.trim();
    if (!trimmedCode) {
      setError("Please enter the verification code.");
      return;
    }
    setPending(true);
    setError("");
    try {
      const response = await fetch(new URL("/auth/verify-code", BACKEND_BASE_URL), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: trimmedCode }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const detail =
          (data && (data.message || data.detail)) ||
          "The code is invalid or has expired. Please try again.";
        setError(typeof detail === "string" ? detail : "The code is invalid or has expired.");
        return;
      }
      if (data?.newUser) {
        setVerificationToken(data.verificationToken || "");
        setName("");
        setStep("name");
        return;
      }
      const token = data?.session?.token;
      if (!token) {
        setError("Something went wrong while signing in. Please try again.");
        return;
      }
      await finishWithSession(token, data.session.expiresIn);
    } catch {
      setError("Could not reach the server. Please check your connection and try again.");
    } finally {
      setPending(false);
    }
  };

  const handleNameSubmit = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Please enter your name.");
      return;
    }
    setPending(true);
    setError("");
    try {
      const response = await fetch(new URL("/auth/complete-registration", BACKEND_BASE_URL), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, verificationToken, name: trimmedName }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.token) {
        const detail =
          (data && (data.message || data.detail)) ||
          "Could not create your account. Please try again.";
        setError(typeof detail === "string" ? detail : "Could not create your account.");
        return;
      }
      await finishWithSession(data.token, data.expiresIn);
    } catch {
      setError("Could not reach the server. Please check your connection and try again.");
    } finally {
      setPending(false);
    }
  };

  const handleResend = async () => {
    await requestCode(email);
  };

  const submitOnEnter = (fn: () => void) => (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !pending) {
      e.preventDefault();
      fn();
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

      <div className="w-full max-w-xs text-left">
        {step === "email" && (
          <div className="flex flex-col gap-3">
            <TextField
              id="email"
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={submitOnEnter(handleEmailSubmit)}
              placeholder="you@example.com"
              autoFocus
              autoComplete="email"
              disabled={pending}
            />
            <Button
              onClick={handleEmailSubmit}
              disabled={pending || !email.trim()}
              className="w-full"
              icon={pending ? <Spinner size={16} className="text-white" /> : null}
            >
              {pending ? "Sending code…" : "Continue with email"}
            </Button>
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              We&apos;ll send a verification code to your email.
            </p>
          </div>
        )}

        {step === "code" && (
          <div className="flex flex-col gap-3">
            <TextField
              id="code"
              label="Verification code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={submitOnEnter(handleCodeSubmit)}
              placeholder="Enter the 6-digit code"
              autoFocus
              autoComplete="one-time-code"
              disabled={pending}
            />
            <Button
              onClick={handleCodeSubmit}
              disabled={pending || !code.trim()}
              className="w-full"
              icon={pending ? <Spinner size={16} className="text-white" /> : null}
            >
              {pending ? "Verifying…" : "Verify code"}
            </Button>
            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setError("");
                }}
                disabled={pending}
                className="font-medium text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Use a different email
              </button>
              <button
                type="button"
                onClick={handleResend}
                disabled={pending}
                className="font-medium text-blue-500 transition-colors hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Resend code
              </button>
            </div>
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">Sent to {email}</p>
          </div>
        )}

        {step === "name" && (
          <div className="flex flex-col gap-3">
            <TextField
              id="name"
              label="Your name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={submitOnEnter(handleNameSubmit)}
              placeholder="What should we call you?"
              autoFocus
              autoComplete="name"
              disabled={pending}
            />
            <Button
              onClick={handleNameSubmit}
              disabled={pending || !name.trim()}
              className="w-full"
              icon={pending ? <Spinner size={16} className="text-white" /> : null}
            >
              {pending ? "Creating account…" : "Create account"}
            </Button>
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              Your email {email} is verified.
            </p>
          </div>
        )}

        {error && (
          <p className="mt-3 text-center text-sm text-red-500" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
