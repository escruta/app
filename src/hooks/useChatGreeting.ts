import { useMemo } from "react";

const GREETINGS: string[] = [
  "What shall we explore?",
  "Ready to dive into your documents?",
  "How can I help you today?",
  "What would you like to ask?",
  "Your sources are ready, where to begin?",
  "Got a question in mind?",
  "What are we working on today?",
  "Let's dig into your sources.",
  "What story are your documents telling?",
  "Curious about something in here?",
  "Let's find some answers.",
  "What should we figure out together?",
  "Your research awaits.",
  "Ask me anything about your sources.",
  "What's on your mind?",
  "Let's turn sources into insights.",
];

const SUBTITLES: string[] = [
  "Pick a question below or type your own.",
  "Try one of the questions below to get started.",
  "Your sources are ready to answer.",
  "Ask anything about your uploaded documents.",
  "The example questions below are a great place to start.",
  "Curious? Type a question and press Enter.",
  "Start with a question about your material.",
  "Let your documents do the talking.",
  "Jump in with any question.",
  "Here to help you understand your sources.",
];

export function useChatGreeting() {
  const greeting = useMemo(() => GREETINGS[Math.floor(Math.random() * GREETINGS.length)], []);
  const subtitle = useMemo(() => SUBTITLES[Math.floor(Math.random() * SUBTITLES.length)], []);

  return { greeting, subtitle };
}
