import { sql } from "drizzle-orm";

import { rateLimit } from "@/src/server/api/rateLimit";
import { error, success } from "@/src/server/api/response";
import { db } from "@/src/server/db";

export async function GET(request: Request) {
  const rateLimitResponse = rateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    await db.execute(sql`SELECT 1`);

    return success({
      status: "ok",
      timestamp: new Date().toISOString(),
      database: "connected",
    });
  } catch {
    return error("Database connection failed", 503);
  }
}
