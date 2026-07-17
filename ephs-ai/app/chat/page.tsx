import type { Metadata } from "next";
import { Suspense } from "react";
import { getCourses, getDataset } from "@/lib/catalog/store";
import { aiEnabled } from "@/lib/env";
import { ChatClient } from "./ChatClient";

export const metadata: Metadata = {
  title: "EPHS AI Assistant",
  description:
    "Chat with an assistant that answers only from the official 2026-27 EPHS Course Guide.",
};

export default function ChatPage() {
  const dataset = getDataset();
  return (
    <Suspense>
      <ChatClient
        aiConfigured={aiEnabled()}
        courseCount={getCourses().length}
        guideTitle={dataset.generated_from.document_title}
        pageCount={dataset.generated_from.page_count}
      />
    </Suspense>
  );
}
