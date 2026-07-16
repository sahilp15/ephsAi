import type { Metadata } from "next";
import { Suspense } from "react";
import { aiEnabled } from "@/lib/env";
import { RecommendClient } from "./RecommendClient";

export const metadata: Metadata = { title: "AI Advisor" };

export default function RecommendPage() {
  return (
    <Suspense>
      <RecommendClient aiConfigured={aiEnabled()} />
    </Suspense>
  );
}
