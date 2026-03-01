import { ApiError } from "@/src/server/api/errors";
import { rateLimit } from "@/src/server/api/rateLimit";
import { created, error } from "@/src/server/api/response";
import { db } from "@/src/server/db";
import { anonymousUsers } from "@/src/server/db/schema";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const rateLimitResponse = rateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json();
    const { id } = body;

    if (!id || typeof id !== "string" || !UUID_REGEX.test(id)) {
      throw new ApiError("Invalid or missing id (must be a valid UUID)");
    }

    const [user] = await db
      .insert(anonymousUsers)
      .values({ id })
      .onConflictDoNothing()
      .returning();

    if (!user) {
      const existing = await db.query.anonymousUsers.findFirst({
        where: (users, { eq }) => eq(users.id, id),
      });
      return created(existing);
    }

    return created(user);
  } catch (e) {
    if (e instanceof ApiError) {
      return error(e.message, e.status);
    }
    return error("Internal server error", 500);
  }
}
