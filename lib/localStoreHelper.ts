import path from "node:path";
import os from "node:os";

export function assertLocalFallbackAllowed(): void {
  const isNetlifyProduction = process.env.NETLIFY === "true" && process.env.CONTEXT === "production";
  const isVercelProduction =
    process.env.VERCEL_ENV === "production" || (process.env.NODE_ENV === "production" && process.env.VERCEL);
  if (isVercelProduction || isNetlifyProduction) {
    throw new Error("Durable Supabase storage is unavailable; local fallback is disabled in production.");
  }
}

/**
 * Resolves a JSON storage file's path.
 * In serverless environments (like Vercel or Netlify Functions), it returns a
 * path in the writeable /tmp directory. In local development, it returns a
 * path in the local .data folder.
 */
export function getLocalStorePath(filename: string): string {
  const isServerless =
    process.env.VERCEL === "1" ||
    process.env.VERCEL === "true" ||
    process.env.LAMBDA_TASK_ROOT ||
    process.env.AWS_EXECUTION_ENV ||
    process.env.NETLIFY === "true";

  if (isServerless) {
    return path.join(os.tmpdir(), "aduflow-data", filename);
  }

  return path.join(process.cwd(), ".data", filename);
}
