import type { Metadata } from "next";
import { adminListAllowlist } from "@/lib/data/admin";
import { getRoleRules } from "@/lib/auth/config";
import { AdminAccessManager } from "@/components/admin/AdminAccessManager";

export const metadata: Metadata = { title: "Admin · Access" };
export const dynamic = "force-dynamic";

export default async function AdminAccessPage() {
  const [allowlist, rules] = await Promise.all([
    adminListAllowlist(),
    Promise.resolve(getRoleRules()),
  ]);
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-ep-charcoal">Administrator access</h2>
        <p className="mt-0.5 text-sm text-ep-muted">
          Approve additional administrator accounts. Domain and environment
          allowlist rules are managed in secure server configuration.
        </p>
      </div>
      <AdminAccessManager
        initial={allowlist}
        envDomain={rules.adminDomain}
        envAllowlist={rules.adminEmails}
      />
    </div>
  );
}
