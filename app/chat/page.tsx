import type { Metadata } from "next";
import { ChatClient } from "@/components/Chat/ChatClient";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: `Chat — ${brand.name}`,
  description: `Ask ${brand.name} your questions about ${brand.school.name}.`,
};

export default function ChatPage() {
  return <ChatClient />;
}
