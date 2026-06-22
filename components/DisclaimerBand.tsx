import { brand } from "@/config/brand";

/**
 * The calm, always-present "not official" disclaimer band.
 * Rendered globally in the layout so it appears on every page.
 */
export function DisclaimerBand() {
  return (
    <div
      role="note"
      className="border-y border-scarlet/20 bg-scarlet-tint px-4 py-2 text-center text-sm text-ink"
    >
      <span className="font-semibold">{brand.name} is a student-built helper, not an official{" "}
        {brand.school.shortName} source.</span>{" "}
      Always confirm important decisions with your counselor.
    </div>
  );
}
