import { AppShell } from "@/components/app-shell/AppShell";

/** Student application shell (sidebar + top bar + command palette + mobile nav). */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
