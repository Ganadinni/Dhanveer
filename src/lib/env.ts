/**
 * Centralised environment variable access.
 * Import this instead of process.env directly to get type safety
 * and a clear crash at startup when required variables are missing.
 *
 * All variables listed here are server-side only — never import this
 * module into client components.
 */

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optionalEnv(key: string, fallback = ""): string {
  return process.env[key] ?? fallback;
}

export const env = {
  // Database
  DATABASE_URL: requireEnv("DATABASE_URL"),

  // App
  NODE_ENV: optionalEnv("NODE_ENV", "development"),
  NEXT_PUBLIC_APP_URL: optionalEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000"),

  // Auth (placeholder — wire up NextAuth / Clerk later)
  NEXTAUTH_SECRET: optionalEnv("NEXTAUTH_SECRET"),
  NEXTAUTH_URL: optionalEnv("NEXTAUTH_URL"),

  // Future: Google Places
  GOOGLE_PLACES_API_KEY: optionalEnv("GOOGLE_PLACES_API_KEY"),

  // Future: WhatsApp
  WHATSAPP_API_TOKEN: optionalEnv("WHATSAPP_API_TOKEN"),
  WHATSAPP_PHONE_NUMBER_ID: optionalEnv("WHATSAPP_PHONE_NUMBER_ID"),

  // Future: AI
  ANTHROPIC_API_KEY: optionalEnv("ANTHROPIC_API_KEY"),
  OPENAI_API_KEY: optionalEnv("OPENAI_API_KEY"),

  // Future: Google Sheets
  GOOGLE_SERVICE_ACCOUNT_EMAIL: optionalEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
  GOOGLE_SERVICE_ACCOUNT_KEY: optionalEnv("GOOGLE_SERVICE_ACCOUNT_KEY"),
} as const;
