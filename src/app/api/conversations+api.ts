import { desc, eq } from "drizzle-orm";

import { ApiError } from "@/src/server/api/errors";
import { getUserId } from "@/src/server/api/getUserId";
import { rateLimit } from "@/src/server/api/rateLimit";
import { created, error, success } from "@/src/server/api/response";
import { db } from "@/src/server/db";
import { chatConversations, chatMessages } from "@/src/server/db/schema";

export async function POST(request: Request) {
  const rateLimitResponse = rateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const userId = getUserId(request);

    const [conversation] = await db
      .insert(chatConversations)
      .values({ userId })
      .returning();

    return created(conversation);
  } catch (e) {
    if (e instanceof ApiError) {
      return error(e.message, e.status);
    }
    return error("Internal server error", 500);
  }
}

export async function GET(request: Request) {
  const rateLimitResponse = rateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const userId = getUserId(request);

    const conversations = await db.query.chatConversations.findMany({
      where: eq(chatConversations.userId, userId),
      orderBy: desc(chatConversations.updatedAt),
    });

    const result = await Promise.all(
      conversations.map(async (convo) => {
        const lastMsg = await db.query.chatMessages.findFirst({
          where: eq(chatMessages.conversationId, convo.id),
          orderBy: desc(chatMessages.createdAt),
        });

        return {
          ...convo,
          lastMessage: lastMsg ? lastMsg.content.slice(0, 100) : undefined,
        };
      }),
    );

    return success(result);
  } catch (e) {
    if (e instanceof ApiError) {
      return error(e.message, e.status);
    }
    return error("Internal server error", 500);
  }
}
