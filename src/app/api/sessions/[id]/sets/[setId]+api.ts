import { and, eq } from "drizzle-orm";

import { ApiError } from "@/src/server/api/errors";
import { getUserId } from "@/src/server/api/getUserId";
import { rateLimit } from "@/src/server/api/rateLimit";
import { error, success } from "@/src/server/api/response";
import { db } from "@/src/server/db";
import { workoutSessions, workoutSets } from "@/src/server/db/schema";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; setId: string }> },
) {
  const rateLimitResponse = rateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const userId = getUserId(request);
    const { id, setId } = await params;
    const body = await request.json();

    const session = await db.query.workoutSessions.findFirst({
      where: and(
        eq(workoutSessions.id, id),
        eq(workoutSessions.userId, userId),
      ),
    });

    if (!session) {
      throw new ApiError("Session not found", 404);
    }

    const set = await db.query.workoutSets.findFirst({
      where: and(eq(workoutSets.id, setId), eq(workoutSets.sessionId, id)),
    });

    if (!set) {
      throw new ApiError("Set not found", 404);
    }

    const [updated] = await db
      .update(workoutSets)
      .set({
        actualReps: body.actualReps ?? set.actualReps,
        completed: body.completed ?? set.completed,
        completedAt: body.completed ? new Date() : null,
      })
      .where(eq(workoutSets.id, setId))
      .returning();

    return success({
      id: updated.id,
      setNumber: updated.setNumber,
      targetReps: updated.targetReps,
      actualReps: updated.actualReps,
      completed: updated.completed,
    });
  } catch (e) {
    if (e instanceof ApiError) {
      return error(e.message, e.status);
    }
    return error("Internal server error", 500);
  }
}
