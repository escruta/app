import { Link } from "react-router";
import { SEOMetadata } from "@/components";
import { Button } from "@/components/ui";
import { motion } from "motion/react";
import SimpleBackground from "@/components/backgrounds/SimpleBackground";

export default function NotFound() {
  const fadeInSlight = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: "easeOut" },
  } as const;

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-white px-6 text-center dark:bg-gray-950">
      <SEOMetadata
        title="404 - Page Not Found - Escruta"
        description="The page you are looking for does not exist. Return to Escruta's homepage to continue your research journey."
        url="https://escruta.com/404"
        image="https://escruta.com/OpenGraphImage.webp"
        twitterCard="summary_large_image"
      />
      <SimpleBackground />

      <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center space-y-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="space-y-2"
        >
          <h1 className="text-6xl font-extrabold tracking-tight text-gray-900 md:text-7xl dark:text-white">
            404
          </h1>
        </motion.div>

        <motion.div
          initial={fadeInSlight.initial}
          animate={fadeInSlight.animate}
          transition={{ ...fadeInSlight.transition, delay: 0.1 }}
          className="space-y-4"
        >
          <h2 className="text-2xl font-semibold text-gray-800 md:text-3xl dark:text-gray-100">
            Lost in knowledge
          </h2>
          <p className="mx-auto max-w-md text-lg leading-relaxed text-gray-600 dark:text-gray-400">
            The information you are looking for is currently unavailable or has found a new home.
          </p>
        </motion.div>

        <motion.div
          initial={fadeInSlight.initial}
          animate={fadeInSlight.animate}
          transition={{ ...fadeInSlight.transition, delay: 0.2 }}
          className="pt-2"
        >
          <Link to="/">
            <Button variant="secondary">Return to the application</Button>
          </Link>
        </motion.div>
      </div>
    </main>
  );
}
