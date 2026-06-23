/**
 * App-wide copy for the EPHS AI Assistant: help cards, how-it-works steps, the
 * chat welcome message, suggested prompts, and the shared quick actions used by
 * both the landing page and the chat composer.
 */

export const helpCards = [
  {
    title: "Course selection",
    body: "Explore AP, honors, PSEO, Pathways, and electives — and which classes fit your goals.",
    icon: "📚",
  },
  {
    title: "Graduation requirements",
    body: "Understand the 54 credits and required courses you need to graduate.",
    icon: "🎓",
  },
  {
    title: "Schedule changes",
    body: "Learn how to request a change and book time with your counselor.",
    icon: "🗓️",
  },
  {
    title: "Clubs & activities",
    body: "Find a club, sport, or activity — and how to get involved.",
    icon: "⚡",
  },
  {
    title: "Who to contact",
    body: "Find your counselor by last name and the right office to email or call.",
    icon: "✉️",
  },
  {
    title: "Important dates",
    body: "Course selection windows, key deadlines, and where to find the calendar.",
    icon: "📅",
  },
] as const;

export const howItWorks = [
  {
    step: 1,
    title: "Ask in plain English",
    body: "Type your question like you'd ask a friend. No logins, no personal info.",
  },
  {
    step: 2,
    title: "Get EPHS-specific answers",
    body: "Answers come from official EPHS information — never made up.",
  },
  {
    step: 3,
    title: "Always links the real source",
    body: "It shows the official page it used, and points you to a counselor when it matters.",
  },
] as const;

/**
 * Quick actions shared by the landing page (deep-link into chat) and the chat
 * composer (send the prompt directly). `prompt` is what gets asked.
 */
export const quickActions = [
  { label: "Course Help", icon: "📚", prompt: "Can you help me choose courses? What are my options for AP, honors, PSEO, and Pathways at EPHS?" },
  { label: "Graduation Requirements", icon: "🎓", prompt: "What are the graduation requirements at EPHS? How many credits do I need?" },
  { label: "Meet a Counselor", icon: "🧭", prompt: "I'd like to meet with my school counselor. How do I find mine and book an appointment?" },
  { label: "Clubs & Activities", icon: "⚡", prompt: "How do I find and join clubs or activities at EPHS?" },
  { label: "Important Dates", icon: "📅", prompt: "What are the important course selection dates for the 2026-27 school year?" },
] as const;

/** The assistant's first message in chat — warm, for students AND families. */
export const welcomeMessage = `Hi! I'm the EPHS AI Assistant — here to help students and families with Eden Prairie High School questions. 🦅 I can help with course selection, graduation requirements, schedule changes, AP/honors/PSEO classes, clubs, important dates, and who to contact.

I answer from official EPHS information and link the source, and I'll point you to a real counselor for big decisions. I'm a helper, not an official EPHS source, and I never store personal info — so no need to share your name or ID. What can I help you with?`;

/** Realistic EPHS questions across categories. */
export const suggestedPrompts = [
  "How many credits do I need to graduate from EPHS?",
  "What classes should I take if I'm into computer science and business?",
  "How do I request a schedule change?",
  "What's the difference between AP, honors, and PSEO?",
  "How do I book an appointment with my counselor?",
  "When does course selection happen for 2026-27?",
  "Who is my counselor if my last name starts with S?",
  "What are Pathways and Capstone courses?",
] as const;
