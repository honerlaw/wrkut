import { desc, eq, ne } from "drizzle-orm";

import { ApiError } from "@/src/server/api/errors";
import { getUserId } from "@/src/server/api/getUserId";
import { rateLimit } from "@/src/server/api/rateLimit";
import { created, error, success } from "@/src/server/api/response";
import { db } from "@/src/server/db";
import {
  routineExercises,
  workoutSessions,
  workoutSets,
} from "@/src/server/db/schema";

export async function GET(request: Request) {
  const rateLimitResponse = rateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const userId = getUserId(request);
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") ?? "20", 10);
    const offset = parseInt(url.searchParams.get("offset") ?? "0", 10);

    const sessions = await db.query.workoutSessions.findMany({
      where: (s, { and: andFn }) =>
        andFn(eq(s.userId, userId), ne(s.status, "in_progress")),
      orderBy: desc(workoutSessions.startedAt),
      limit,
      offset,
      with: {
        routine: { columns: { name: true } },
        routineDay: { columns: { dayLabel: true } },
        sets: { columns: { completed: true } },
      },
    });

    const data = sessions.map((s) => {
      const totalSets = s.sets.length;
      const completedSets = s.sets.filter((set) => set.completed).length;
      const durationSeconds =
        s.finishedAt && s.startedAt
          ? Math.round((s.finishedAt.getTime() - s.startedAt.getTime()) / 1000)
          : null;

      return {
        id: s.id,
        routineName: s.routine.name,
        dayLabel: s.routineDay.dayLabel,
        status: s.status,
        startedAt: s.startedAt.toISOString(),
        finishedAt: s.finishedAt?.toISOString() ?? null,
        durationSeconds,
        totalSets,
        completedSets,
        notes: s.notes,
      };
    });

    return success(data);
  } catch (e) {
    if (e instanceof ApiError) {
      return error(e.message, e.status);
    }
    return error("Internal server error", 500);
  }
}

function parseTargetReps(reps: string): number {
  const match = reps.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

export async function POST(request: Request) {
  const rateLimitResponse = rateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const userId = getUserId(request);
    const body = await request.json();

    if (!body.routineId || !body.routineDayId) {
      throw new ApiError("routineId and routineDayId are required");
    }

    const exercises = await db.query.routineExercises.findMany({
      where: eq(routineExercises.routineDayId, body.routineDayId),
      orderBy: (ex, { asc }) => asc(ex.sortOrder),
    });

    if (exercises.length === 0) {
      throw new ApiError("No exercises found for this day", 404);
    }

    const result = await db.transaction(async (tx) => {
      const [session] = await tx
        .insert(workoutSessions)
        .values({
          userId,
          routineId: body.routineId,
          routineDayId: body.routineDayId,
        })
        .returning();

      const exercisesWithSets = [];

      for (const exercise of exercises) {
        const targetReps = parseTargetReps(exercise.reps);
        const setsToCreate = [];

        for (let i = 1; i <= exercise.sets; i++) {
          setsToCreate.push({
            sessionId: session.id,
            exerciseId: exercise.id,
            setNumber: i,
            targetReps,
          });
        }

        const insertedSets = await tx
          .insert(workoutSets)
          .values(setsToCreate)
          .returning();

        exercisesWithSets.push({
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          restSeconds: exercise.restSeconds,
          sets: insertedSets.map((s) => ({
            id: s.id,
            setNumber: s.setNumber,
            targetReps: s.targetReps,
            actualReps: s.actualReps,
            completed: s.completed,
          })),
        });
      }

      return {
        id: session.id,
        routineId: session.routineId,
        routineDayId: session.routineDayId,
        status: session.status,
        startedAt: session.startedAt.toISOString(),
        finishedAt: null,
        notes: session.notes,
        exercises: exercisesWithSets,
      };
    });

    return created(result);
  } catch (e) {
    if (e instanceof ApiError) {
      return error(e.message, e.status);
    }
    return error("Internal server error", 500);
  }
}
