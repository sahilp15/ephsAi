import type { Metadata } from "next";
import { FeedbackForm } from "@/components/FeedbackForm";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: `Feedback — ${brand.name}`,
  description: `Help improve ${brand.name} for EPHS students.`,
};

export default function FeedbackPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
      <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
        Share feedback
      </h1>
      <p className="mt-4 text-gray-700">
        Found a wrong or missing answer? Have an idea? Tell us — it helps make{" "}
        {brand.name} better for everyone at {brand.school.name}.
      </p>
      <div className="mt-10">
        <FeedbackForm />
      </div>
    </div>
  );
}
