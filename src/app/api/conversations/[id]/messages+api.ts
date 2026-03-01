import { asc, eq } from "drizzle-orm";

import { ApiError } from "@/src/server/api/errors";
import { getUserId } from "@/src/server/api/getUserId";
import { rateLimit } from "@/src/server/api/rateLimit";
import { error, success } from "@/src/server/api/response";
import { db } from "@/src/server/db";
import { chatConversations, chatMessages } from "@/src/server/db/schema";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const rateLimitResponse = rateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const userId = getUserId(request);
    const { id } = await params;

    const conversation = await db.query.chatConversations.findFirst({
      where: eq(chatConversations.id, id),
    });

    if (!conversation || conversation.userId !== userId) {
      throw new ApiError("Conversation not found", 404);
    }

    const messages = await db.query.chatMessages.findMany({
      where: eq(chatMessages.conversationId, id),
      orderBy: asc(chatMessages.createdAt),
    });

    return success(messages);
  } catch (e) {
    if (e instanceof ApiError) {
      return error(e.message, e.status);
    }
    return error("Internal server error", 500);
  }
}
