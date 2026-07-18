"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { upsertEquivalencyAction, deleteEquivalencyAction } from "@/app/admin/actions";
import type { CourseEquivalencyRow } from "@/lib/supabase/types";

export function EquivalencyManager({
  initial,
  catalog,
}: {
  initial: CourseEquivalencyRow[];
  catalog: { id: string; title: string }[];
}) {
  const router = useRouter();
  const [sourceName, setSourceName] = useState("");
  const [courseId, setCourseId] = useState("");
  const [isTransfer, setIsTransfer] = useState(false);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const titleById = new Map(catalog.map((c) => [c.id, c.title]));

  async function add() {
    if (!sourceName.trim()) return;
    setSaving(true);
    setError(null);
    const res = await upsertEquivalencyAction({
      sourceName,
      courseId: courseId || null,
      isTransfer,
      note: note || undefined,
    });
    setSaving(false);
    if (!res.ok) {
      setError("Couldn't save that mapping.");
      return;
    }
    setSourceName("");
    setCourseId("");
    setIsTransfer(false);
    setNote("");
    router.refresh();
  }

  async function remove(id: string) {
    await deleteEquivalencyAction(id);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-ep-border-soft bg-white p-4 shadow-card">
        <h3 className="text-sm font-bold text-ep-charcoal">Add a course equivalency</h3>
        <p className="mt-0.5 text-xs text-ep-muted">
          Map a transcript course name (old title, transfer name, abbreviation) to an
          EPHS course, or mark it as a transfer with no EPHS equivalent. Used
          automatically the next time a transcript is processed.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <input
            value={sourceName}
            onChange={(e) => setSourceName(e.target.value)}
            placeholder="Transcript course name"
            className="rounded-md border border-ep-border bg-white px-2 py-1.5 text-sm outline-none focus:border-ep-red"
          />
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="rounded-md border border-ep-border bg-white px-2 py-1.5 text-sm outline-none focus:border-ep-red"
          >
            <option value="">— No EPHS match (transfer) —</option>
            {catalog.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optional)"
            className="rounded-md border border-ep-border bg-white px-2 py-1.5 text-sm outline-none focus:border-ep-red"
          />
          <label className="flex items-center gap-2 text-sm text-ep-ink">
            <input
              type="checkbox"
              checked={isTransfer}
              onChange={(e) => setIsTransfer(e.target.checked)}
              className="h-4 w-4 accent-[#D8272E]"
            />
            Mark as transfer course
          </label>
        </div>
        {error ? <p className="mt-2 text-sm text-ep-red-dark">{error}</p> : null}
        <button
          type="button"
          onClick={add}
          disabled={saving || !sourceName.trim()}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-ep-red px-4 py-2 text-sm font-semibold text-white hover:bg-ep-red-dark disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Save mapping
        </button>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-ep-faint">
          Existing mappings ({initial.length})
        </h3>
        {initial.length === 0 ? (
          <p className="text-sm text-ep-muted">No equivalencies defined yet.</p>
        ) : (
          <ul className="space-y-1.5">
            {initial.map((eq) => (
              <li
                key={eq.id}
                className="flex items-center justify-between rounded-lg border border-ep-border-soft bg-white px-3 py-2 text-sm"
              >
                <span className="text-ep-ink">
                  <span className="font-semibold">{eq.source_name}</span> →{" "}
                  {eq.course_id ? titleById.get(eq.course_id) ?? eq.course_id : "Transfer (no match)"}
                </span>
                <button
                  type="button"
                  onClick={() => remove(eq.id)}
                  className="text-ep-faint hover:text-ep-red-dark"
                  aria-label="Delete mapping"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
