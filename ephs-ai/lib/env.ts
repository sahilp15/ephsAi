import { z } from "zod";

/**
 * Typed, validated environment access. Server-only values are read lazily so
 * the app boots cleanly in demo mode with no configuration at all.
 */
const envSchema = z.object({
  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENAI_MODEL: z.string().min(1).default("gpt-4o-mini"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  AI_RATE_LIMIT_PER_HOUR: z.coerce.number().int().positive().default(20),
  DEMO_MODE: z
    .string()
    .default("true")
    .transform((v) => v !== "false"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse({
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || undefined,
    OPENAI_MODEL: process.env.OPENAI_MODEL || undefined,
    APP_URL: process.env.APP_URL || undefined,
    AI_RATE_LIMIT_PER_HOUR: process.env.AI_RATE_LIMIT_PER_HOUR || undefined,
    DEMO_MODE: process.env.DEMO_MODE || undefined,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || undefined,
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || undefined,
    SUPABASE_SERVICE_ROLE_KEY:
      process.env.SUPABASE_SERVICE_ROLE_KEY || undefined,
  });
  if (!parsed.success) {
    throw new Error(
      `Invalid environment configuration: ${parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ")}`,
    );
  }
  cached = parsed.data;
  return cached;
}

/** True when an OpenAI key is configured; otherwise the recommender uses Smart match mode. */
export function aiEnabled(): boolean {
  return Boolean(getEnv().OPENAI_API_KEY);
}
