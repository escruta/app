import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { useAuth, useToast } from "@/hooks";
import { motion, AnimatePresence } from "motion/react";
import { SEOMetadata } from "@/components";
import { Button, TextField, Spinner } from "@/components/ui";
import { getSignErrorMessage } from "@/lib/utils";

export function SignUpPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [allowSubmit, setAllowSubmit] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const checkPasswordStrength = (password: string) => {
    const criteria = [
      {
        valid: password.length >= 8,
        message: "Password must be at least 8 characters.",
      },
      {
        valid: /[A-Z]/.test(password),
        message: "Password must contain at least one uppercase letter.",
      },
      {
        valid: /[a-z]/.test(password),
        message: "Password must contain at least one lowercase letter.",
      },
      {
        valid: /[0-9]/.test(password),
        message: "Password must contain at least one number.",
      },
    ];

    const failedCriterion = criteria.find((criterion) => !criterion.valid);

    return {
      isValid: !failedCriterion,
      errorMessage: failedCriterion ? failedCriterion.message : "",
    };
  };

  useEffect(() => {
    if (passwordTouched) {
      const validationResult = checkPasswordStrength(password);
      setPasswordError(validationResult.errorMessage);
    }
  }, [password, passwordTouched]);

  useEffect(() => {
    const isEmailValid = email.trim() !== "" && /\S+@\S+\.\S+/.test(email);
    const isFullNameValid = fullName.trim() !== "";
    const passwordValidation = checkPasswordStrength(password);
    const isPasswordValid =
      passwordValidation.isValid && password.trim() !== "";
    const doPasswordsMatch =
      password === confirmPassword && confirmPassword !== "";

    setAllowSubmit(
      isEmailValid && isFullNameValid && isPasswordValid && doPasswordsMatch,
    );
  }, [fullName, email, password, confirmPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!fullName.trim()) {
      setError("Full name is required.");
      return;
    }

    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email.");
      return;
    }

    if (!password.trim()) {
      setError("Password is required.");
      return;
    }

    const passwordValidation = checkPasswordStrength(password);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.errorMessage);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await signUp(email, password, fullName);
      if (response.status === 201) {
        showToast("Registration successful! Redirecting...", "success", {
          duration: 1500,
        });
        setTimeout(() => {
          navigate("/");
        }, 1500);
      }
    } catch (err: unknown) {
      const error = err as { status: number; message?: string };
      if (error.status) {
        setError(error.message || getSignErrorMessage(error.status, "signup"));
      } else {
        setError(
          "Cannot connect to the server. Please check your connection and try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (!passwordTouched) {
      setPasswordTouched(true);
    }
  };

  return (
    <>
      <SEOMetadata
        title="Sign up - Escruta"
        description="Create your free Escruta account and start organizing your knowledge with AI-powered research tools."
        url="https://escruta.com/signup"
        image="https://escruta.com/OpenGraphImage.webp"
        twitterCard="summary_large_image"
      />
      <motion.form
        onSubmit={handleSubmit}
        className="relative w-full bg-transparent text-gray-800 dark:text-gray-200 pb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
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
          Sign up
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <TextField
            id="fullName"
            label="Full Name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="John Doe"
            required
            autoFocus
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <TextField
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@example.com"
            required
            autoComplete="email"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <TextField
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={handlePasswordChange}
            required
            autoComplete="new-password"
            className={passwordError ? "border-red-400 mb-1" : ""}
          />
          <AnimatePresence mode="wait">
            {passwordError && (
              <motion.p
                className="text-sm text-red-500 mb-4"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                {passwordError}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.6 }}
        >
          <TextField
            id="confirmPassword"
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
            className={
              password !== confirmPassword && confirmPassword
                ? "border-red-400 mb-1"
                : ""
            }
          />
          <AnimatePresence mode="wait">
            {password !== confirmPassword && confirmPassword && (
              <motion.p
                className="text-sm text-red-500 mb-4"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                Passwords do not match.
              </motion.p>
            )}
          </AnimatePresence>
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
          transition={{ duration: 0.3, delay: 0.7 }}
        >
          <Button
            type="submit"
            disabled={loading || !allowSubmit}
            className="w-full"
            icon={loading ? <Spinner size={16} className="text-white" /> : null}
          >
            {loading ? "Signing up..." : "Sign up"}
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
          transition={{ duration: 0.3, delay: 0.8 }}
        >
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{" "}
          </span>
          <Link
            to="/signin"
            className="text-sm text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
          >
            Sign in
          </Link>
        </motion.div>
      </motion.form>
    </>
  );
}
