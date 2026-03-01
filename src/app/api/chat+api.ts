import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";

import { ApiError } from "@/src/server/api/errors";
import { getUserId } from "@/src/server/api/getUserId";
import { rateLimit } from "@/src/server/api/rateLimit";
import { error } from "@/src/server/api/response";
import { SYSTEM_PROMPT } from "@/src/server/ai/systemPrompt";
import { db } from "@/src/server/db";
import { chatConversations, chatMessages } from "@/src/server/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  const rateLimitResponse = rateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const userId = getUserId(request);
    const { messages, conversationId } = await request.json();

    let convoId = conversationId;

    if (!convoId) {
      const [convo] = await db
        .insert(chatConversations)
        .values({ userId })
        .returning();
      convoId = convo.id;
    }

    const lastUserMessage = messages[messages.length - 1];
    if (lastUserMessage?.role === "user") {
      await db.insert(chatMessages).values({
        conversationId: convoId,
        role: "user",
        content: lastUserMessage.content,
      });
    }

    const result = streamText({
      model: anthropic("claude-sonnet-4-6"),
      system: SYSTEM_PROMPT,
      messages,
      onFinish: async ({ text }) => {
        await db.insert(chatMessages).values({
          conversationId: convoId,
          role: "assistant",
          content: text,
        });

        await db
          .update(chatConversations)
          .set({ updatedAt: new Date() })
          .where(eq(chatConversations.id, convoId));
      },
    });

    return result.toUIMessageStreamResponse({
      headers: { "X-Conversation-Id": convoId },
    });
  } catch (e) {
    if (e instanceof ApiError) {
      return error(e.message, e.status);
    }
    return error("Internal server error", 500);
  }
}
