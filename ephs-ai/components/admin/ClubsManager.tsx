"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus, RotateCcw, Save, Trash2, X } from "lucide-react";
import clsx from "clsx";
import {
  upsertClubAction,
  setClubActiveAction,
  deleteClubAction,
  restoreClubAction,
} from "@/app/(staff)/admin/actions";
import { ChipInput } from "@/components/forms/ChipInput";
import type { Club, ClubInput } from "@/lib/clubs/types";

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const GRADES = ["9", "10", "11", "12"];

interface FormState {
  id?: string;
  name: string;
  category: string;
  description: string;
  descriptionSource: "official" | "general";
  advisor: string;
  studentLeaders: string[];
  meetingDays: string[];
  meetingTime: string;
  meetingFrequency: string;
  location: string;
  grades: string[];
  membershipRequirements: string;
  contactEmail: string;
  joinInstructions: string;
  website: string;
  registrationUrl: string;
  additionalNotes: string;
  sourceUrl: string;
  active: boolean;
}

function emptyForm(defaultCategory: string): FormState {
  return {
    name: "",
    category: defaultCategory,
    description: "",
    descriptionSource: "general",
    advisor: "",
    studentLeaders: [],
    meetingDays: [],
    meetingTime: "",
    meetingFrequency: "",
    location: "",
    grades: [],
    membershipRequirements: "",
    contactEmail: "",
    joinInstructions: "",
    website: "",
    registrationUrl: "",
    additionalNotes: "",
    sourceUrl: "",
    active: true,
  };
}

function clubToForm(c: Club): FormState {
  return {
    id: c.id,
    name: c.name,
    category: typeof c.category === "string" ? c.category : "",
    description: c.description,
    descriptionSource: c.descriptionSource,
    advisor: c.advisor ?? "",
    studentLeaders: c.studentLeaders,
    meetingDays: c.meetingDays,
    meetingTime: c.meetingTime ?? "",
    meetingFrequency: c.meetingFrequency ?? "",
    location: c.location ?? "",
    grades: c.grades,
    membershipRequirements: c.membershipRequirements ?? "",
    contactEmail: c.contactEmail ?? "",
    joinInstructions: c.joinInstructions ?? "",
    website: c.website ?? "",
    registrationUrl: c.registrationUrl ?? "",
    additionalNotes: c.additionalNotes ?? "",
    sourceUrl: c.sourceUrl,
    active: c.active,
  };
}

const ERROR_LABELS: Record<string, string> = {
  unconfigured: "Supabase is not configured, so edits cannot be saved.",
  name_required: "A club name is required.",
  invalid_name: "That name can't be turned into a valid id.",
  invalid_email: "Enter a valid contact email or leave it blank.",
  invalid_website: "The website must start with http:// or https://.",
  invalid_registration_url: "The registration URL must start with http:// or https://.",
  duplicate: "A club with that name already exists.",
  not_found: "That club could not be found.",
};

const inputCls =
  "w-full rounded-md border border-ep-border bg-ep-card px-2 py-1.5 text-sm outline-none focus:border-ep-red";

export function ClubsManager({
  initialClubs,
  deletedClubs,
  categories,
  persistence,
}: {
  initialClubs: Club[];
  deletedClubs: Club[];
  categories: string[];
  persistence: boolean;
}) {
  const router = useRouter();
  const defaultCategory = categories[0] ?? "";

  const [form, setForm] = useState<FormState>(() => emptyForm(defaultCategory));
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");

  const editing = Boolean(form.id);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return initialClubs.filter((c) => {
      if (categoryFilter && c.category !== categoryFilter) return false;
      if (activeFilter === "active" && !c.active) return false;
      if (activeFilter === "inactive" && c.active) return false;
      if (q) {
        const hay = `${c.name} ${c.description} ${c.category} ${c.advisor ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [initialClubs, search, categoryFilter, activeFilter]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleFromList(list: string[], value: string): string[] {
    return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
  }

  function startAdd() {
    setForm(emptyForm(defaultCategory));
    setShowForm(true);
    setError(null);
    setSuccess(null);
  }

  function startEdit(c: Club) {
    setForm(clubToForm(c));
    setShowForm(true);
    setError(null);
    setSuccess(null);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelForm() {
    setForm(emptyForm(defaultCategory));
    setShowForm(false);
    setError(null);
  }

  async function submit() {
    if (!form.name.trim()) {
      setError(ERROR_LABELS.name_required ?? "A club name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    const res = await upsertClubAction(form as ClubInput);
    setSaving(false);
    if (!res.ok) {
      setError((res.error && ERROR_LABELS[res.error]) || "Couldn't save that club.");
      return;
    }
    setSuccess(editing ? "Club updated." : "Club added.");
    setForm(emptyForm(defaultCategory));
    setShowForm(false);
    router.refresh();
  }

  async function toggleActive(c: Club) {
    setBusyId(c.id);
    const res = await setClubActiveAction(c.id, !c.active);
    setBusyId(null);
    if (!res.ok) {
      setError((res.error && ERROR_LABELS[res.error]) || "Couldn't update that club.");
      return;
    }
    router.refresh();
  }

  async function remove(c: Club) {
    if (typeof window !== "undefined" && !window.confirm(`Remove "${c.name}"? It can be restored later.`)) {
      return;
    }
    setBusyId(c.id);
    const res = await deleteClubAction(c.id);
    setBusyId(null);
    if (!res.ok) {
      setError((res.error && ERROR_LABELS[res.error]) || "Couldn't remove that club.");
      return;
    }
    setSuccess(`Removed "${c.name}".`);
    router.refresh();
  }

  async function restore(c: Club) {
    setBusyId(c.id);
    const res = await restoreClubAction(c.id);
    setBusyId(null);
    if (!res.ok) {
      setError((res.error && ERROR_LABELS[res.error]) || "Couldn't restore that club.");
      return;
    }
    setSuccess(`Restored "${c.name}".`);
    router.refresh();
  }

  const categoryOptions = useMemo(() => {
    const set = new Set(categories);
    for (const c of initialClubs) if (typeof c.category === "string") set.add(c.category);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [categories, initialClubs]);

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search clubs…"
          className={clsx(inputCls, "max-w-xs")}
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-md border border-ep-border bg-ep-card px-2 py-1.5 text-sm outline-none focus:border-ep-red"
        >
          <option value="">All categories</option>
          {categoryOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value as typeof activeFilter)}
          className="rounded-md border border-ep-border bg-ep-card px-2 py-1.5 text-sm outline-none focus:border-ep-red"
        >
          <option value="all">Active &amp; inactive</option>
          <option value="active">Active only</option>
          <option value="inactive">Inactive only</option>
        </select>
        <div className="ml-auto">
          <button
            type="button"
            onClick={showForm ? cancelForm : startAdd}
            disabled={!persistence}
            className="inline-flex items-center gap-1.5 rounded-lg bg-ep-red px-4 py-2 text-sm font-semibold text-white hover:bg-ep-red-dark disabled:opacity-50"
          >
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? "Close" : "Add club"}
          </button>
        </div>
      </div>

      {success ? <p className="text-sm font-semibold text-ep-success">{success}</p> : null}
      {error ? <p className="text-sm text-ep-red-dark">{error}</p> : null}

      {/* Add / edit form */}
      {showForm ? (
        <div className="rounded-xl border border-ep-border-soft bg-ep-card p-4 shadow-card">
          <h3 className="text-sm font-bold text-ep-charcoal">
            {editing ? `Edit club` : "Add a club"}
          </h3>
          {editing ? (
            <p className="mt-0.5 text-xs text-ep-muted">
              Editing <span className="font-mono">{form.id}</span>. The id is immutable.
            </p>
          ) : null}

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-ep-charcoal">Name *</span>
              <input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className={clsx(inputCls, "mt-1")}
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-ep-charcoal">Category</span>
              <select
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                className={clsx(inputCls, "mt-1")}
              >
                {categoryOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <label className="block sm:col-span-2">
              <span className="text-sm font-semibold text-ep-charcoal">Description</span>
              <textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={3}
                className={clsx(inputCls, "mt-1")}
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-ep-charcoal">Description source</span>
              <select
                value={form.descriptionSource}
                onChange={(e) =>
                  set("descriptionSource", e.target.value === "official" ? "official" : "general")
                }
                className={clsx(inputCls, "mt-1")}
              >
                <option value="general">General summary</option>
                <option value="official">Official wording</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-ep-charcoal">Advisor</span>
              <input
                value={form.advisor}
                onChange={(e) => set("advisor", e.target.value)}
                className={clsx(inputCls, "mt-1")}
              />
            </label>

            <div className="sm:col-span-2">
              <ChipInput
                label="Student leaders"
                values={form.studentLeaders}
                onChange={(next) => set("studentLeaders", next)}
                placeholder="Add a name and press Enter"
              />
            </div>

            <div className="sm:col-span-2">
              <span className="block text-sm font-semibold text-ep-charcoal">Meeting days</span>
              <div className="mt-1.5 flex flex-wrap gap-3">
                {WEEKDAYS.map((d) => (
                  <label key={d} className="flex items-center gap-1.5 text-sm text-ep-ink">
                    <input
                      type="checkbox"
                      checked={form.meetingDays.includes(d)}
                      onChange={() => set("meetingDays", toggleFromList(form.meetingDays, d))}
                      className="h-4 w-4 accent-[#D8272E]"
                    />
                    {d}
                  </label>
                ))}
              </div>
            </div>

            <label className="block">
              <span className="text-sm font-semibold text-ep-charcoal">Meeting time</span>
              <input
                value={form.meetingTime}
                onChange={(e) => set("meetingTime", e.target.value)}
                placeholder="e.g. 3:00–4:00 PM"
                className={clsx(inputCls, "mt-1")}
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-ep-charcoal">Meeting frequency</span>
              <input
                value={form.meetingFrequency}
                onChange={(e) => set("meetingFrequency", e.target.value)}
                placeholder="e.g. Weekly"
                className={clsx(inputCls, "mt-1")}
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-ep-charcoal">Location</span>
              <input
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
                className={clsx(inputCls, "mt-1")}
              />
            </label>

            <div className="block">
              <span className="block text-sm font-semibold text-ep-charcoal">Grades</span>
              <div className="mt-1.5 flex flex-wrap gap-3">
                {GRADES.map((g) => (
                  <label key={g} className="flex items-center gap-1.5 text-sm text-ep-ink">
                    <input
                      type="checkbox"
                      checked={form.grades.includes(g)}
                      onChange={() => set("grades", toggleFromList(form.grades, g))}
                      className="h-4 w-4 accent-[#D8272E]"
                    />
                    {g}
                  </label>
                ))}
              </div>
            </div>

            <label className="block sm:col-span-2">
              <span className="text-sm font-semibold text-ep-charcoal">Membership requirements</span>
              <textarea
                value={form.membershipRequirements}
                onChange={(e) => set("membershipRequirements", e.target.value)}
                rows={2}
                className={clsx(inputCls, "mt-1")}
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-ep-charcoal">Contact email</span>
              <input
                value={form.contactEmail}
                onChange={(e) => set("contactEmail", e.target.value)}
                className={clsx(inputCls, "mt-1")}
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-ep-charcoal">Website</span>
              <input
                value={form.website}
                onChange={(e) => set("website", e.target.value)}
                placeholder="https://…"
                className={clsx(inputCls, "mt-1")}
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="text-sm font-semibold text-ep-charcoal">Join instructions</span>
              <textarea
                value={form.joinInstructions}
                onChange={(e) => set("joinInstructions", e.target.value)}
                rows={2}
                className={clsx(inputCls, "mt-1")}
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-ep-charcoal">Registration URL</span>
              <input
                value={form.registrationUrl}
                onChange={(e) => set("registrationUrl", e.target.value)}
                placeholder="https://…"
                className={clsx(inputCls, "mt-1")}
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-ep-charcoal">Source URL</span>
              <input
                value={form.sourceUrl}
                onChange={(e) => set("sourceUrl", e.target.value)}
                placeholder="https://…"
                className={clsx(inputCls, "mt-1")}
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="text-sm font-semibold text-ep-charcoal">Additional notes</span>
              <textarea
                value={form.additionalNotes}
                onChange={(e) => set("additionalNotes", e.target.value)}
                rows={2}
                className={clsx(inputCls, "mt-1")}
              />
            </label>

            <label className="flex items-center gap-2 text-sm text-ep-ink">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => set("active", e.target.checked)}
                className="h-4 w-4 accent-[#D8272E]"
              />
              Active (visible to students)
            </label>
          </div>

          {error ? <p className="mt-2 text-sm text-ep-red-dark">{error}</p> : null}

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={submit}
              disabled={saving || !persistence || !form.name.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-ep-red px-4 py-2 text-sm font-semibold text-white hover:bg-ep-red-dark disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {editing ? "Save changes" : "Add club"}
            </button>
            <button
              type="button"
              onClick={cancelForm}
              className="rounded-lg border border-ep-border px-4 py-2 text-sm font-semibold text-ep-muted hover:text-ep-charcoal"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {/* Clubs list */}
      <div>
        <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-ep-faint">
          Clubs ({filtered.length})
        </h3>
        {filtered.length === 0 ? (
          <p className="text-sm text-ep-muted">No clubs match those filters.</p>
        ) : (
          <ul className="space-y-1.5">
            {filtered.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-ep-border-soft bg-ep-card px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ep-ink">
                    {c.name}
                    {!c.active ? (
                      <span className="ml-2 rounded-[3px] bg-ep-bg px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ep-faint">
                        Inactive
                      </span>
                    ) : null}
                  </p>
                  <p className="truncate text-xs text-ep-muted">{c.category || "Uncategorized"}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => startEdit(c)}
                    disabled={!persistence}
                    className="rounded-md border border-ep-border px-2 py-1 text-xs font-semibold text-ep-muted hover:text-ep-charcoal disabled:opacity-40"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleActive(c)}
                    disabled={!persistence || busyId === c.id}
                    className="rounded-md border border-ep-border px-2 py-1 text-xs font-semibold text-ep-muted hover:text-ep-charcoal disabled:opacity-40"
                  >
                    {busyId === c.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : c.active ? (
                      "Deactivate"
                    ) : (
                      "Activate"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(c)}
                    disabled={!persistence || busyId === c.id}
                    className="text-ep-faint hover:text-ep-red-dark disabled:opacity-40"
                    aria-label={`Remove ${c.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Deleted clubs */}
      {deletedClubs.length > 0 ? (
        <div>
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-ep-faint">
            Removed clubs ({deletedClubs.length})
          </h3>
          <ul className="space-y-1.5">
            {deletedClubs.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-ep-border bg-ep-bg px-3 py-2 text-sm"
              >
                <span className="truncate text-ep-muted">{c.name}</span>
                <button
                  type="button"
                  onClick={() => restore(c)}
                  disabled={!persistence || busyId === c.id}
                  className="inline-flex items-center gap-1.5 rounded-md border border-ep-border bg-ep-card px-2 py-1 text-xs font-semibold text-ep-muted hover:text-ep-charcoal disabled:opacity-40"
                >
                  {busyId === c.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RotateCcw className="h-3.5 w-3.5" />
                  )}
                  Restore
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
