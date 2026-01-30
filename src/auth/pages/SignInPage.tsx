import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { useAuth, useCookie } from "@/hooks";
import { motion, AnimatePresence } from "motion/react";
import { SEOMetadata } from "@/components";
import { Button, TextField, Spinner } from "@/components/ui";
import { getSignErrorMessage } from "@/lib/utils";

export function SignInPage() {
  const [savedEmail, setSavedEmail] = useCookie<{ email: string }>(
    "savedEmail",
    { email: "" },
  );
  const [email, setEmail] = useState(savedEmail?.email || "");
  const [password, setPassword] = useState("");
  const [rememberEmail, setRememberEmail] = useState(!!savedEmail?.email);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [allowSubmit, setAllowSubmit] = useState(false);
  const navigate = useNavigate();
  const { signIn } = useAuth();

  useEffect(() => {
    const isEmailValid = email.trim() !== "" && /\S+@\S+\.\S+/.test(email);
    const isPasswordValid = password.trim() !== "";

    setAllowSubmit(isEmailValid && isPasswordValid);
  }, [email, password]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email.");
      return;
    }

    if (!password.trim()) {
      setError("Password is required.");
      return;
    }

    setLoading(true);

    try {
      await signIn(email, password);
      if (rememberEmail) {
        setSavedEmail({ email });
      } else if (savedEmail?.email) {
        setSavedEmail({ email: "" });
      }
      navigate("/");
    } catch (err: unknown) {
      const error = err as { status: number; message?: string };
      if (error.status) {
        setError(error.message || getSignErrorMessage(error.status, "signin"));
      } else {
        setError(
          "Cannot connect to the server. Please check your connection and try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  function handlePasswordChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPassword(e.target.value);
  }

  return (
    <>
      <SEOMetadata
        title="Sign in - Escruta"
        description="Sign in to your Escruta account to access your research notebooks, notes, and AI-powered study tools."
        url="https://escruta.com/signin"
        image="https://escruta.com/OpenGraphImage.webp"
        twitterCard="summary_large_image"
      />
      <motion.form
        onSubmit={handleSubmit}
        className="relative w-full bg-transparent text-gray-800 dark:text-gray-200 pb-6"
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 25,
          duration: 0.5,
        }}
      >
        <motion.h1
          className="text-2xl font-bold mb-6 select-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          Sign in
        </motion.h1>
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <TextField
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            autoFocus={!savedEmail?.email}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <TextField
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={handlePasswordChange}
            required
            autoComplete="current-password"
            autoFocus={!!savedEmail?.email}
            className="mb-6"
          />
        </motion.div>
        <motion.div
          className="mb-4 flex items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <input
            type="checkbox"
            id="rememberEmail"
            checked={rememberEmail}
            onChange={(e) => setRememberEmail(e.target.checked)}
            className="mr-2 size-4 text-blue-500 border-gray-300 rounded-xs shadow-none focus:ring-blue-500 dark:focus:ring-blue-400"
          />
          <label
            htmlFor="rememberEmail"
            className="text-gray-700 dark:text-gray-300 select-none text-sm cursor-pointer"
          >
            Remember my email
          </label>
        </motion.div>
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded-xs overflow-hidden"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.6 }}
        >
          <Button
            type="submit"
            disabled={loading || !allowSubmit}
            className="w-full"
            icon={loading ? <Spinner size={16} className="text-white" /> : null}
          >
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ duration: 0.3, delay: 0.6 }}
          className="flex items-center my-6 px-12"
        >
          <div className="flex-grow h-px bg-gray-300/65 dark:bg-gray-600/65"></div>
        </motion.div>

        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.7 }}
        >
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{" "}
          </span>
          <Link
            to="/signup"
            className="text-sm text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
          >
            Sign up
          </Link>
        </motion.div>
      </motion.form>
    </>
  );
}
