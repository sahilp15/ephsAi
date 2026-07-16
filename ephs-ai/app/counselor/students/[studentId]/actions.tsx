"use client";

import { useRouter } from "next/navigation";
import { Printer, UserRoundCheck } from "lucide-react";
import { useStudent } from "@/lib/client/student-context";
import { getDemoStudent } from "@/lib/demo/students";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-1.5 rounded-lg border border-ep-border bg-white px-4 py-2 text-sm font-semibold text-ep-charcoal hover:bg-ep-bg"
    >
      <Printer aria-hidden className="h-4 w-4" />
      Print summary
    </button>
  );
}

/** Loads the fictional demo student's profile and plan into this browser. */
export function LoadDemoButton({ studentId }: { studentId: string }) {
  const router = useRouter();
  const { loadDemo } = useStudent();

  return (
    <button
      type="button"
      onClick={() => {
        const demo = getDemoStudent(studentId);
        if (!demo) return;
        loadDemo(demo.profile, demo.plan);
        router.push("/dashboard");
      }}
      className="inline-flex items-center gap-1.5 rounded-lg bg-ep-red px-4 py-2 text-sm font-semibold text-white hover:bg-ep-red-dark"
    >
      <UserRoundCheck aria-hidden className="h-4 w-4" />
      Explore as this student
    </button>
  );
}
