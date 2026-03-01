import { and, eq } from "drizzle-orm";

import { ApiError } from "@/src/server/api/errors";
import { getUserId } from "@/src/server/api/getUserId";
import { rateLimit } from "@/src/server/api/rateLimit";
import { error, success } from "@/src/server/api/response";
import { db } from "@/src/server/db";
import { workoutSessions } from "@/src/server/db/schema";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const rateLimitResponse = rateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const userId = getUserId(request);
    const { id } = await params;

    const session = await db.query.workoutSessions.findFirst({
      where: and(
        eq(workoutSessions.id, id),
        eq(workoutSessions.userId, userId),
      ),
      with: {
        routine: { columns: { name: true } },
        routineDay: { columns: { dayLabel: true } },
        sets: {
          orderBy: (s, { asc }) => asc(s.setNumber),
        },
      },
    });

    if (!session) {
      throw new ApiError("Session not found", 404);
    }

    const exerciseIds = [...new Set(session.sets.map((s) => s.exerciseId))];
    const exercises = await db.query.routineExercises.findMany({
      where: (ex, { inArray }) => inArray(ex.id, exerciseIds),
    });

    const exerciseMap = new Map(exercises.map((e) => [e.id, e]));

    const totalSets = session.sets.length;
    const completedSets = session.sets.filter((s) => s.completed).length;
    const durationSeconds =
      session.finishedAt && session.startedAt
        ? Math.round(
            (session.finishedAt.getTime() - session.startedAt.getTime()) / 1000,
          )
        : null;

    const groupedExercises = exerciseIds.map((exerciseId) => {
      const exercise = exerciseMap.get(exerciseId);
      return {
        exerciseName: exercise?.name ?? "Unknown",
        sets: session.sets
          .filter((s) => s.exerciseId === exerciseId)
          .map((s) => ({
            setNumber: s.setNumber,
            targetReps: s.targetReps,
            actualReps: s.actualReps,
            completed: s.completed,
          })),
      };
    });

    return success({
      id: session.id,
      routineName: session.routine.name,
      dayLabel: session.routineDay.dayLabel,
      status: session.status,
      startedAt: session.startedAt.toISOString(),
      finishedAt: session.finishedAt?.toISOString() ?? null,
      durationSeconds,
      totalSets,
      completedSets,
      notes: session.notes,
      exercises: groupedExercises,
    });
  } catch (e) {
    if (e instanceof ApiError) {
      return error(e.message, e.status);
    }
    return error("Internal server error", 500);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const rateLimitResponse = rateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const userId = getUserId(request);
    const { id } = await params;
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

    const [updated] = await db
      .update(workoutSessions)
      .set({
        status: body.status,
        finishedAt: new Date(),
        notes: body.notes ?? session.notes,
      })
      .where(eq(workoutSessions.id, id))
      .returning();

    return success({
      id: updated.id,
      status: updated.status,
      finishedAt: updated.finishedAt?.toISOString() ?? null,
    });
  } catch (e) {
    if (e instanceof ApiError) {
      return error(e.message, e.status);
    }
    return error("Internal server error", 500);
  }
}
