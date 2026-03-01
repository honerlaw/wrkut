import { desc, eq } from "drizzle-orm";

import { ApiError } from "@/src/server/api/errors";
import { getUserId } from "@/src/server/api/getUserId";
import { rateLimit } from "@/src/server/api/rateLimit";
import { created, error, success } from "@/src/server/api/response";
import { db } from "@/src/server/db";
import {
  routineDays,
  routineExercises,
  routines,
} from "@/src/server/db/schema";

export async function GET(request: Request) {
  const rateLimitResponse = rateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const userId = getUserId(request);

    const result = await db.query.routines.findMany({
      where: eq(routines.userId, userId),
      orderBy: desc(routines.createdAt),
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

    return success(result);
  } catch (e) {
    if (e instanceof ApiError) {
      return error(e.message, e.status);
    }
    return error("Internal server error", 500);
  }
}

export async function POST(request: Request) {
  const rateLimitResponse = rateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const userId = getUserId(request);
    const body = await request.json();

    if (!body.name || typeof body.name !== "string") {
      throw new ApiError("name is required");
    }

    if (!Array.isArray(body.days) || body.days.length === 0) {
      throw new ApiError("At least one day is required");
    }

    const result = await db.transaction(async (tx) => {
      const [routine] = await tx
        .insert(routines)
        .values({
          userId,
          name: body.name,
          description: body.description ?? null,
          frequency: body.frequency ?? null,
        })
        .returning();

      const daysWithExercises = [];

      for (const day of body.days) {
        const [insertedDay] = await tx
          .insert(routineDays)
          .values({
            routineId: routine.id,
            dayLabel: day.dayLabel,
            sortOrder: day.sortOrder,
          })
          .returning();

        const exercises = [];

        if (Array.isArray(day.exercises)) {
          for (const exercise of day.exercises) {
            const [insertedExercise] = await tx
              .insert(routineExercises)
              .values({
                routineDayId: insertedDay.id,
                name: exercise.name,
                sets: exercise.sets,
                reps: exercise.reps,
                restSeconds: exercise.restSeconds ?? null,
                notes: exercise.notes ?? null,
                sortOrder: exercise.sortOrder,
              })
              .returning();

            exercises.push(insertedExercise);
          }
        }

        daysWithExercises.push({ ...insertedDay, exercises });
      }

      return { ...routine, days: daysWithExercises };
    });

    return created(result);
  } catch (e) {
    if (e instanceof ApiError) {
      return error(e.message, e.status);
    }
    return error("Internal server error", 500);
  }
}
