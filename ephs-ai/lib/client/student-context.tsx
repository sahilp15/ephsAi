"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  CourseMeta,
  PlanEntry,
  StudentProfile,
} from "@/lib/domain/plan-types";
import { DEFAULT_PROFILE } from "@/lib/domain/plan-types";

/**
 * Client-side student store.
 *
 * Privacy-first MVP persistence: the student's profile and plan live in
 * their own browser (localStorage) and are never written to a server.
 * The production path (Supabase Auth + Postgres with RLS) replaces this
 * store behind the same interface — see docs/ARCHITECTURE.md.
 */

const PROFILE_KEY = "ephs-ai:profile:v1";
const PLAN_KEY = "ephs-ai:plan:v1";

interface StudentState {
  profile: StudentProfile;
  plan: PlanEntry[];
  ready: boolean;
  catalogMeta: Map<string, CourseMeta>;
  catalogList: CourseMeta[];
  metaReady: boolean;
  setProfile: (p: StudentProfile) => void;
  addEntry: (e: Omit<PlanEntry, "id">) => void;
  updateEntry: (id: string, patch: Partial<PlanEntry>) => void;
  removeEntry: (id: string) => void;
  loadDemo: (profile: StudentProfile, plan: PlanEntry[]) => void;
  clearAll: () => void;
}

const StudentContext = createContext<StudentState | null>(null);

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `e-${Math.random().toString(36).slice(2, 10)}`;
}

export function StudentProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfileState] = useState<StudentProfile>(DEFAULT_PROFILE);
  const [plan, setPlan] = useState<PlanEntry[]>([]);
  const [ready, setReady] = useState(false);
  const [catalogList, setCatalogList] = useState<CourseMeta[]>([]);
  const [metaReady, setMetaReady] = useState(false);

  useEffect(() => {
    setProfileState(readJSON(PROFILE_KEY, DEFAULT_PROFILE));
    setPlan(readJSON(PLAN_KEY, []));
    setReady(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/catalog/planner-meta")
      .then((r) => r.json())
      .then((data: { courses: CourseMeta[] }) => {
        if (!cancelled) {
          setCatalogList(data.courses);
          setMetaReady(true);
        }
      })
      .catch(() => {
        if (!cancelled) setMetaReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const persistProfile = useCallback((p: StudentProfile) => {
    setProfileState(p);
    try {
      window.localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
    } catch {
      /* storage unavailable (private mode) — state stays in memory */
    }
  }, []);

  const persistPlan = useCallback((updater: (prev: PlanEntry[]) => PlanEntry[]) => {
    setPlan((prev) => {
      const next = updater(prev);
      try {
        window.localStorage.setItem(PLAN_KEY, JSON.stringify(next));
      } catch {
        /* storage unavailable — state stays in memory */
      }
      return next;
    });
  }, []);

  const addEntry = useCallback(
    (e: Omit<PlanEntry, "id">) => {
      persistPlan((prev) => [...prev, { ...e, id: makeId() }]);
    },
    [persistPlan],
  );

  const updateEntry = useCallback(
    (id: string, patch: Partial<PlanEntry>) => {
      persistPlan((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...patch, id: e.id } : e)),
      );
    },
    [persistPlan],
  );

  const removeEntry = useCallback(
    (id: string) => {
      persistPlan((prev) => prev.filter((e) => e.id !== id));
    },
    [persistPlan],
  );

  const loadDemo = useCallback(
    (demoProfile: StudentProfile, demoPlan: PlanEntry[]) => {
      persistProfile(demoProfile);
      persistPlan(() => demoPlan);
    },
    [persistProfile, persistPlan],
  );

  const clearAll = useCallback(() => {
    try {
      window.localStorage.removeItem(PROFILE_KEY);
      window.localStorage.removeItem(PLAN_KEY);
    } catch {
      /* ignore */
    }
    setProfileState(DEFAULT_PROFILE);
    setPlan([]);
  }, []);

  const catalogMeta = useMemo(
    () => new Map(catalogList.map((c) => [c.id, c])),
    [catalogList],
  );

  const value = useMemo<StudentState>(
    () => ({
      profile,
      plan,
      ready,
      catalogMeta,
      catalogList,
      metaReady,
      setProfile: persistProfile,
      addEntry,
      updateEntry,
      removeEntry,
      loadDemo,
      clearAll,
    }),
    [
      profile,
      plan,
      ready,
      catalogMeta,
      catalogList,
      metaReady,
      persistProfile,
      addEntry,
      updateEntry,
      removeEntry,
      loadDemo,
      clearAll,
    ],
  );

  return (
    <StudentContext.Provider value={value}>{children}</StudentContext.Provider>
  );
}

export function useStudent(): StudentState {
  const ctx = useContext(StudentContext);
  if (!ctx) throw new Error("useStudent must be used within StudentProvider");
  return ctx;
}
