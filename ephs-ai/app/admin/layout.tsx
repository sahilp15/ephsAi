import { ShieldCheck } from "lucide-react";
import { requireAdmin } from "@/lib/auth/session";
import { AdminNav } from "@/components/admin/AdminNav";

export const dynamic = "force-dynamic";

/**
 * Admin area shell. `requireAdmin` gates every nested route on the server —
 * the single backend authorization boundary for the entire administrator
 * area. Individual pages and actions also re-check, so hiding nav is never the
 * security layer.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2.5 text-3xl font-bold leading-none text-ep-charcoal sm:text-4xl">
          <ShieldCheck aria-hidden className="h-7 w-7 text-ep-red" />
          Administrator
        </h1>
        <p className="text-sm text-ep-muted">Signed in as {admin.email}</p>
      </div>
      <AdminNav />
      <div>{children}</div>
    </div>
  );
}
