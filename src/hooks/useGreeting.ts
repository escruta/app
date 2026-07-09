import { useMemo } from "react";

type TimeOfDay = "morning" | "afternoon" | "evening";

function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  return "evening";
}

const TIME_GREETINGS: Record<TimeOfDay, string[]> = {
  morning: [
    "Good morning",
    "Top of the morning",
    "Rise and shine",
    "Morning",
    "Happy morning",
    "Lovely morning",
    "What a beautiful morning",
    "Bonjour",
    "Buenos días",
    "Good day",
  ],
  afternoon: [
    "Good afternoon",
    "Hope your day is going well",
    "Afternoon",
    "Lovely afternoon",
    "Good day",
    "Hola",
    "Ciao",
    "Buenas tardes",
    "How goes it",
    "Cheers",
  ],
  evening: [
    "Good evening",
    "Good to see you tonight",
    "Evening",
    "Buenas noches",
    "Hope you had a great day",
    "Winding down?",
    "Time to unwind",
    "Aloha",
    "Greetings",
    "Salutations",
  ],
};

const COMMON_GREETINGS: string[] = [
  "Welcome",
  "Welcome back",
  "Hello",
  "Hi",
  "Hey there",
  "Good to see you",
  "Glad you're here",
  "Great to have you back",
  "Nice to see you again",
  "Howdy",
  "Ahoy",
  "What's up",
  "Yo",
  "Hiya",
  "Pleased to meet your acquaintance",
  "Look who's back",
  "Long time no see",
  "Welcome aboard",
  "Lovely to see you",
  "Delighted to have you",
  "Fantastic to see you",
  "Wonderful to have you here",
  "Thrilled you stopped by",
  "Always a pleasure",
  "The legend returns",
  "Back in action",
  "You made it",
  "There you are",
  "Fancy seeing you here",
  "Well, well, well",
  "Welcome to the hub",
  "Let's get to work",
  "Ready for another great day",
  "Hope you're doing well",
  "It's a beautiful day",
  "Make yourself at home",
  "Step right in",
];

function pickGreeting(): string {
  const timeOfDay = getTimeOfDay();
  const pool = Math.random() < 0.6 ? TIME_GREETINGS[timeOfDay] : COMMON_GREETINGS;
  return pool[Math.floor(Math.random() * pool.length)];
}

const SUBTITLES: string[] = [
  "Ready to create something great?",
  "What would you like to work on today?",
  "Where shall we begin?",
  "What are we building today?",
  "Let's get something started.",
  "Your workspace is ready — dive in.",
  "What story are we writing today?",
  "What sparks your interest today?",
  "Time to turn ideas into reality.",
  "Pick your adventure for today.",
  "What brings you here today?",
  "Ready to make your mark?",
  "A blank canvas awaits.",
  "Let's build something together.",
  "What shall we create first?",
  "What's on your mind today?",
  "How can we make progress today?",
  "Pick up where you left off?",
  "What shall we dive into?",
  "What's the plan for today?",
  "Let's get something done today.",
  "Time to make things happen.",
  "What's your focus for today?",
  "Ready to dive back in?",
  "What deserves your attention?",
  "Let's make today productive.",
  "Something new or something familiar?",
  "Where to next?",
  "Your next breakthrough awaits.",
  "What's the priority for today?",
  "What challenge are we tackling?",
  "Let's pick a project and run with it.",
  "What's calling your name today?",
  "The day is yours — where to first?",
  "Ready for a productive session?",
  "What do you feel like working on?",
  "Let's get those gears turning.",
  "What's the first thing on your list?",
  "Where shall we make progress?",
  "Something big or something quick?",
  "What's the mission for today?",
  "Ready to check things off the list?",
  "What would make today a win?",
  "Your dashboard awaits, captain.",
  "Let's make some magic happen.",
  "Time to roll up the sleeves.",
  "What are we conquering today?",
  "What's inspiring you today?",
  "Let's turn plans into progress.",
  "What shall we explore?",
  "What's the next move?",
  "What are you in the mood for?",
  "Let's get the ball rolling.",
  "What's the first order of business?",
];

export function useGreeting() {
  const greeting = useMemo(() => pickGreeting(), []);
  const subtitle = useMemo(() => SUBTITLES[Math.floor(Math.random() * SUBTITLES.length)], []);

  return { greeting, subtitle };
}
