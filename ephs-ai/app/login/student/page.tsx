import type { Metadata } from "next";
import { AuthLoginCard } from "@/components/auth/AuthLoginCard";
import { supabaseConfigured } from "@/lib/auth/config";
import { getEnv } from "@/lib/env";

export const metadata: Metadata = { title: "Student Sign In" };
export const dynamic = "force-dynamic";

export default function StudentLoginPage({
  searchParams,
}: {
  searchParams: { error?: string; next?: string };
}) {
  return (
    <div className="py-6 sm:py-12">
      <AuthLoginCard
        intent="student"
        configured={supabaseConfigured()}
        studentDomain={getEnv().STUDENT_EMAIL_DOMAIN}
        next={searchParams.next}
        initialError={searchParams.error}
      />
    </div>
  );
}
