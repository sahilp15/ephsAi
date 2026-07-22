import type { Metadata } from "next";
import { AuthLoginCard } from "@/components/auth/AuthLoginCard";
import { supabaseConfigured } from "@/lib/auth/config";
import { getEnv } from "@/lib/env";

export const metadata: Metadata = { title: "Administrator Sign In" };
export const dynamic = "force-dynamic";

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams: { error?: string; next?: string };
}) {
  return (
    <div className="flex flex-1 flex-col justify-center py-6 sm:py-10">
      <AuthLoginCard
        intent="admin"
        configured={supabaseConfigured()}
        studentDomain={getEnv().STUDENT_EMAIL_DOMAIN}
        next={searchParams.next}
        initialError={searchParams.error}
      />
    </div>
  );
}
