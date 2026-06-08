import path from "node:path";
import os from "node:os";

/**
 * Resolves a JSON storage file's path.
 * In serverless environments (like Vercel), it returns a path in the writeable /tmp directory.
 * In local development, it returns a path in the local .data folder.
 */
export function getLocalStorePath(filename: string): string {
  const isServerless =
    process.env.VERCEL === "1" ||
    process.env.VERCEL === "true" ||
    process.env.LAMBDA_TASK_ROOT ||
    process.env.AWS_EXECUTION_ENV;

  if (isServerless) {
    return path.join(os.tmpdir(), "aduflow-data", filename);
  }

  return path.join(process.cwd(), ".data", filename);
}
