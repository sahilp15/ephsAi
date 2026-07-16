import type { Metadata } from "next";
import { getPathways } from "@/lib/catalog/store";
import { OnboardingClient } from "./OnboardingClient";

export const metadata: Metadata = { title: "Get Started" };

export default function OnboardingPage() {
  const pathways = getPathways().map((p) => ({ id: p.id, name: p.name }));
  return <OnboardingClient pathways={pathways} />;
}
