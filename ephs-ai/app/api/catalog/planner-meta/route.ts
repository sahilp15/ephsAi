import { NextResponse } from "next/server";
import { getCourseMetaList } from "@/lib/catalog/meta";

export const runtime = "nodejs";

/**
 * GET /api/catalog/planner-meta — compact catalog metadata for client-side
 * plan validation (id, title, grades, parsed prerequisites, term span,
 * flags, source pages). Public catalog data only; cacheable.
 */
export async function GET() {
  return NextResponse.json(
    { courses: getCourseMetaList() },
    {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    },
  );
}
