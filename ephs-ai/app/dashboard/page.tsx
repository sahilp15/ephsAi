import type { Metadata } from "next";
import { getPathways } from "@/lib/catalog/store";
import { DashboardClient } from "./DashboardClient";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  const pathways = getPathways().map((p) => ({ id: p.id, name: p.name }));
  return <DashboardClient pathways={pathways} />;
}
