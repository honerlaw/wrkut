# Phase 4: AI Chat Interface with Streaming

## Goal

Build the AI-powered personal trainer chat on the Home tab. After this phase, users can have a streaming conversation with an AI trainer, use voice-to-text for input, and accept AI-generated workout plans that are saved as routines via the Phase 3 API. Chat history persists in the database.

## Dependencies

```bash
npm install ai @ai-sdk/react @ai-sdk/anthropic @jamsch/expo-speech-recognition
```

- `ai` — Vercel AI SDK core (streaming, tool definitions)
- `@ai-sdk/react` — React hooks for chat (`useChat`)
- `@ai-sdk/anthropic` — Anthropic provider for AI SDK
- `@jamsch/expo-speech-recognition` — Native speech recognition for iOS/Android

Also add to `.env`:

```
ANTHROPIC_API_KEY=sk-ant-...
```

And to `.env.example`:

```
ANTHROPIC_API_KEY=your-anthropic-api-key-here
```

## Files to Create / Modify

### New Files — API Routes

#### `src/app/api/chat+api.ts`

Streaming chat endpoint using Vercel AI SDK.

**`POST /api/chat`**

Request body (follows Vercel AI SDK `useChat` format):
```json
{
  "messages": [
    { "role": "user", "content": "Create a 3-day push pull legs routine" }
  ],
  "conversationId": "optional-uuid"
}
```

Implementation:

```ts
import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";

export async function POST(request: Request) {
  const userId = getUserId(request);
  const { messages, conversationId } = await request.json();

  // If no conversationId, create a new conversation
  // Save the user's latest message to the database

  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    system: SYSTEM_PROMPT,
    messages,
    onFinish: async ({ text }) => {
      // Save assistant response to database
    },
  });

  return result.toDataStreamResponse();
}
```

#### System Prompt

Define as a constant in the chat API file or a separate file `src/server/ai/systemPrompt.ts`:

```
You are a knowledgeable and motivating personal fitness trainer inside the wrkut app. Your role is to help users create effective workout routines tailored to their goals, experience level, and available equipment.

Guidelines:
- Be encouraging but realistic. Don't overpromise results.
- Ask clarifying questions when the user's goals or constraints are unclear.
- When suggesting exercises, include sets, reps (can be ranges like "8-12"), and rest periods.
- Keep responses concise — users are on mobile.

When you create a complete workout plan, wrap it in markers so the app can detect it:

<workout-plan>
{
  "name": "Plan Name",
  "description": "Brief description",
  "frequency": "3x per week",
  "days": [
    {
      "dayLabel": "Day 1 - Push",
      "sortOrder": 0,
      "exercises": [
        {
          "name": "Bench Press",
          "sets": 4,
          "reps": "8-10",
          "restSeconds": 90,
          "notes": "Control the eccentric",
          "sortOrder": 0
        }
      ]
    }
  ]
}
</workout-plan>

Only use the <workout-plan> markers when presenting a complete, finalized routine — not for partial suggestions or examples. The JSON inside must be valid and match the exact structure shown above.
```

#### `src/app/api/conversations+api.ts`

**`POST /api/conversations`** — Create a new conversation.

Request body: (empty or `{}`)

Response:
```json
{
  "success": true,
  "data": { "id": "...", "createdAt": "...", "updatedAt": "..." }
}
```

**`GET /api/conversations`** — List conversations for the current user.

Returns conversations ordered by `updated_at` descending. Include a `lastMessage` field with the content preview (first 100 characters) of the most recent message.

#### `src/app/api/conversations/[id]/messages+api.ts`

**`GET /api/conversations/:id/messages`** — Get all messages for a conversation.

Response:
```json
{
  "success": true,
  "data": [
    { "id": "...", "role": "user", "content": "...", "createdAt": "..." },
    { "id": "...", "role": "assistant", "content": "...", "createdAt": "..." }
  ]
}
```

### New Files — Chat Components

#### `src/components/routes/Home/HomeRoute.tsx` (replace placeholder)

The Home tab now shows the chat interface. Layout:

- `SafeAreaView` with `flex-1 bg-background`
- Header: "Chat" title with a "New Chat" button (creates a new conversation)
- `ChatMessageList` component (scrollable message area)
- `ChatInput` component (fixed at bottom)

State management:
- Use `useChat` from `@ai-sdk/react` for message state and streaming
- Track `conversationId` in state — create one on first message send
- Load previous messages if resuming a conversation

#### `src/components/routes/Home/ChatMessageList.tsx`

Scrollable list of chat messages. Uses `FlatList` (inverted) for performance.

Each message renders as a `ChatBubble`.

- Auto-scrolls to bottom when new messages arrive
- Shows a typing indicator when the AI is streaming (use `isLoading` from `useChat`)

#### `src/components/routes/Home/ChatBubble.tsx`

Individual chat message bubble. Props:

```ts
type ChatBubbleProps = {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
};
```

Styles:
- **User messages**: aligned right, `bg-accent` background, `text-background` text
- **Assistant messages**: aligned left, `bg-surface` background, `text-text-primary` text
- Both: `rounded-2xl px-4 py-3 max-w-[85%]`
- Streaming indicator: pulsing `...` at the end while `isStreaming` is true

**Workout plan detection**: Parse the `content` for `<workout-plan>...</workout-plan>` markers. If found:
1. Extract the JSON between the markers
2. Render the surrounding text normally
3. Render a `WorkoutPlanCard` component in place of the raw JSON

#### `src/components/routes/Home/WorkoutPlanCard.tsx`

Displays a parsed workout plan from the AI response. Props:

```ts
type WorkoutPlanCardProps = {
  plan: CreateRoutineInput;  // from src/types/routine.ts
  onAccept: () => void;
};
```

Layout:
- `Card` container with `border-accent` border to distinguish from regular cards
- Plan name as `Typography variant="h3"`
- Description and frequency as `Typography variant="caption"`
- Collapsible day summaries: day label + exercise count
- "Accept Plan" `Button` (primary variant) at the bottom

When "Accept Plan" is pressed:
1. Call `POST /api/routines` with the plan data
2. Show a success indicator
3. Navigate to the Routine tab using `router.push("/(tabs)/routine")`

#### `src/components/routes/Home/ChatInput.tsx`

Chat input bar fixed at the bottom of the screen. Layout:

- Container: `bg-surface border-t border-border px-4 py-3 flex-row items-end gap-2`
- `Input` component (multiline, auto-growing up to 4 lines)
- Voice button: microphone icon `Pressable`, left of the text input
- Send button: `Pressable` with send arrow icon, right of the input
- Send button is disabled (dimmed) when input is empty or AI is responding

#### `src/components/routes/Home/hooks/useVoiceInput.ts`

Hook that manages speech-to-text:

```ts
type UseVoiceInputReturn = {
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  transcript: string;
};
```

Implementation:
- Uses `@jamsch/expo-speech-recognition` for native speech recognition
- `startListening()` begins recognition, sets `isListening` to true
- As speech is recognized, `transcript` updates in real-time
- `stopListening()` ends recognition
- On web platform, check if the Web Speech API is available; if not, hide the voice button

Integration with `ChatInput`:
- When the user taps the mic button, call `startListening()`
- While listening, the mic button pulses/highlights with `bg-accent` tint
- When listening stops, append the transcript to the current input text
- Tapping mic again while listening calls `stopListening()`

### New Files — Shared Types

#### `src/types/chat.ts`

```ts
export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type Conversation = {
  id: string;
  createdAt: string;
  updatedAt: string;
  lastMessage?: string;
};
```

## Key Technical Decisions

1. **Vercel AI SDK** — provides `useChat` hook that handles streaming, message state, and abort control out of the box. The `streamText` server function handles the Anthropic API call and converts to a streaming response format the hook expects.

2. **`<workout-plan>` markers** — rather than using AI SDK tool calls (which complicate streaming UX), the AI wraps structured data in XML-like markers within its text response. The client parses these out for rendering. This keeps the AI response natural and readable while enabling structured extraction.

3. **Conversation persistence** — messages are saved to the database on both send (user) and completion (assistant via `onFinish`). This means if the app is closed mid-stream, the user's message is saved but the partial AI response is lost — which is acceptable since the AI can regenerate it.

4. **`@jamsch/expo-speech-recognition`** — this library wraps the native iOS/Android speech recognition APIs. It works offline (no cloud API needed) and provides real-time partial results. On web, it falls back to the Web Speech API where available.

5. **Inverted FlatList** — standard pattern for chat UIs. The list is inverted so new messages appear at the bottom and the list auto-scrolls correctly.

## Acceptance Criteria

- [ ] Home tab shows the chat interface instead of placeholder
- [ ] User can type a message and see it appear as a right-aligned bubble
- [ ] AI responds with streamed text that appears incrementally in a left-aligned bubble
- [ ] Streaming indicator shows while the AI is responding
- [ ] Voice button starts speech recognition on tap
- [ ] Recognized speech text populates the input field
- [ ] AI can generate workout plans wrapped in `<workout-plan>` markers
- [ ] Workout plans render as a styled card with plan details and "Accept Plan" button
- [ ] Accepting a plan saves it via `POST /api/routines` and navigates to the Routine tab
- [ ] Chat messages persist — closing and reopening the conversation shows previous messages
- [ ] "New Chat" button starts a fresh conversation
- [ ] Invalid/malformed workout plan JSON in markers gracefully falls back to rendering as plain text
- [ ] `ANTHROPIC_API_KEY` is in `.env` (gitignored) and `.env.example` (committed)
- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run build:web` succeeds
