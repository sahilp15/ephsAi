/**
 * Generated, app-wide copy for Eddy: help cards, how-it-works steps, the chat
 * welcome message, and suggested prompts. Centralized so wording is easy to tune.
 */

export const helpCards = [
  {
    title: "Course selection",
    body: "Explore AP, honors, PSEO, and pathways — and which classes fit your interests.",
    icon: "📚",
  },
  {
    title: "Graduation requirements",
    body: "Understand the credits and courses you need to walk the stage.",
    icon: "🎓",
  },
  {
    title: "Schedule changes",
    body: "Learn how to request a change and who to talk to about it.",
    icon: "🗓️",
  },
  {
    title: "Clubs & activities",
    body: "Find a club, sport, or activity — and how to join or start one.",
    icon: "⚡",
  },
  {
    title: "Who to contact",
    body: "Figure out the right counselor, office, or staff member to email.",
    icon: "✉️",
  },
  {
    title: "School logistics",
    body: "Bell schedule, parking, buses, lunch, and the everyday stuff.",
    icon: "🏫",
  },
] as const;

export const howItWorks = [
  {
    step: 1,
    title: "Ask in plain English",
    body: "Type your question like you'd ask a friend. No forms, no logins.",
  },
  {
    step: 2,
    title: "Eddy answers from official EPHS info",
    body: "Answers come only from real Eden Prairie High information — never made up.",
  },
  {
    step: 3,
    title: "Always links the real source",
    body: "Eddy shows the official page it used, and tells you who to ask when unsure.",
  },
] as const;

/** Eddy's first message in the chat — warm, honest about what it can/can't do. */
export const welcomeMessage = `Hi! I'm Eddy, your Eden Prairie High guide. 🦅 I can help you figure out course choices, graduation requirements, how to change your schedule, clubs to join, and who to email about almost anything at EPHS.

I answer from official EPHS info and always link the source — but I'm a student-built helper, not your counselor, so check big decisions with a real adult. I never store any personal info, so no need to share your name or ID. What can I help you with?`;

/** Eight realistic EPHS student questions across categories. */
export const suggestedPrompts = [
  "What classes should I take if I'm into computer science and business?",
  "How many credits do I need to graduate from EPHS?",
  "How do I request a schedule change, and who do I talk to?",
  "What's the difference between AP, honors, and PSEO classes?",
  "How do I find a club to join — and what if there isn't one I like?",
  "Who do I email if I have a question about my graduation plan?",
  "What does the bell schedule look like on a normal day?",
  "I'm a sophomore interested in engineering — what's a good course path?",
] as const;
