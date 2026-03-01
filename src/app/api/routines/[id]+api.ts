import { and, eq } from "drizzle-orm";

import { ApiError } from "@/src/server/api/errors";
import { getUserId } from "@/src/server/api/getUserId";
import { rateLimit } from "@/src/server/api/rateLimit";
import { error, success } from "@/src/server/api/response";
import { db } from "@/src/server/db";
import { routines } from "@/src/server/db/schema";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const rateLimitResponse = rateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const userId = getUserId(request);
    const { id } = await params;

    const routine = await db.query.routines.findFirst({
      where: and(eq(routines.id, id), eq(routines.userId, userId)),
      with: {
        days: {
          orderBy: (days, { asc }) => asc(days.sortOrder),
          with: {
            exercises: {
              orderBy: (exercises, { asc }) => asc(exercises.sortOrder),
            },
          },
        },
      },
    });

    if (!routine) {
      throw new ApiError("Routine not found", 404);
    }

    return success(routine);
  } catch (e) {
    if (e instanceof ApiError) {
      return error(e.message, e.status);
    }
    return error("Internal server error", 500);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const rateLimitResponse = rateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const userId = getUserId(request);
    const { id } = await params;

    const [deleted] = await db
      .delete(routines)
      .where(and(eq(routines.id, id), eq(routines.userId, userId)))
      .returning();

    if (!deleted) {
      throw new ApiError("Routine not found", 404);
    }

    return success(null);
  } catch (e) {
    if (e instanceof ApiError) {
      return error(e.message, e.status);
    }
    return error("Internal server error", 500);
  }
}
