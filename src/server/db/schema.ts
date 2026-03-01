import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// ─── Anonymous Users ─────────────────────────────────────────────
export const anonymousUsers = pgTable("anonymous_users", {
  id: uuid("id").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── Routines ────────────────────────────────────────────────────
export const routines = pgTable("routines", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => anonymousUsers.id),
  name: text("name").notNull(),
  description: text("description"),
  frequency: text("frequency"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const routineDays = pgTable("routine_days", {
  id: uuid("id").primaryKey().defaultRandom(),
  routineId: uuid("routine_id")
    .notNull()
    .references(() => routines.id, { onDelete: "cascade" }),
  dayLabel: text("day_label").notNull(),
  sortOrder: integer("sort_order").notNull(),
});

export const routineExercises = pgTable("routine_exercises", {
  id: uuid("id").primaryKey().defaultRandom(),
  routineDayId: uuid("routine_day_id")
    .notNull()
    .references(() => routineDays.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  sets: integer("sets").notNull(),
  reps: text("reps").notNull(),
  restSeconds: integer("rest_seconds"),
  notes: text("notes"),
  sortOrder: integer("sort_order").notNull(),
});

// ─── Workout Sessions ────────────────────────────────────────────
export const workoutSessions = pgTable("workout_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => anonymousUsers.id),
  routineId: uuid("routine_id")
    .notNull()
    .references(() => routines.id),
  routineDayId: uuid("routine_day_id")
    .notNull()
    .references(() => routineDays.id),
  status: text("status").notNull().default("in_progress"),
  startedAt: timestamp("started_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  notes: text("notes"),
});

export const workoutSets = pgTable("workout_sets", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => workoutSessions.id, { onDelete: "cascade" }),
  exerciseId: uuid("exercise_id")
    .notNull()
    .references(() => routineExercises.id),
  setNumber: integer("set_number").notNull(),
  targetReps: integer("target_reps").notNull(),
  actualReps: integer("actual_reps"),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

// ─── Chat ────────────────────────────────────────────────────────
export const chatConversations = pgTable("chat_conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => anonymousUsers.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => chatConversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── Relations ───────────────────────────────────────────────────
export const anonymousUsersRelations = relations(
  anonymousUsers,
  ({ many }) => ({
    routines: many(routines),
    workoutSessions: many(workoutSessions),
    chatConversations: many(chatConversations),
  }),
);

export const routinesRelations = relations(routines, ({ one, many }) => ({
  user: one(anonymousUsers, {
    fields: [routines.userId],
    references: [anonymousUsers.id],
  }),
  days: many(routineDays),
  sessions: many(workoutSessions),
}));

export const routineDaysRelations = relations(routineDays, ({ one, many }) => ({
  routine: one(routines, {
    fields: [routineDays.routineId],
    references: [routines.id],
  }),
  exercises: many(routineExercises),
}));

export const routineExercisesRelations = relations(
  routineExercises,
  ({ one }) => ({
    day: one(routineDays, {
      fields: [routineExercises.routineDayId],
      references: [routineDays.id],
    }),
  }),
);

export const workoutSessionsRelations = relations(
  workoutSessions,
  ({ one, many }) => ({
    user: one(anonymousUsers, {
      fields: [workoutSessions.userId],
      references: [anonymousUsers.id],
    }),
    routine: one(routines, {
      fields: [workoutSessions.routineId],
      references: [routines.id],
    }),
    routineDay: one(routineDays, {
      fields: [workoutSessions.routineDayId],
      references: [routineDays.id],
    }),
    sets: many(workoutSets),
  }),
);

export const workoutSetsRelations = relations(workoutSets, ({ one }) => ({
  session: one(workoutSessions, {
    fields: [workoutSets.sessionId],
    references: [workoutSessions.id],
  }),
  exercise: one(routineExercises, {
    fields: [workoutSets.exerciseId],
    references: [routineExercises.id],
  }),
}));

export const chatConversationsRelations = relations(
  chatConversations,
  ({ one, many }) => ({
    user: one(anonymousUsers, {
      fields: [chatConversations.userId],
      references: [anonymousUsers.id],
    }),
    messages: many(chatMessages),
  }),
);

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  conversation: one(chatConversations, {
    fields: [chatMessages.conversationId],
    references: [chatConversations.id],
  }),
}));
