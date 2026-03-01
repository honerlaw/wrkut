export type WorkoutSession = {
  id: string;
  routineName: string;
  dayLabel: string;
  status: "in_progress" | "completed" | "cancelled";
  startedAt: string;
  finishedAt: string | null;
  durationSeconds: number | null;
  totalSets: number;
  completedSets: number;
  notes: string | null;
};

export type SessionDetail = WorkoutSession & {
  exercises: SessionExercise[];
};

export type SessionExercise = {
  exerciseName: string;
  sets: SessionSet[];
};

export type SessionSet = {
  setNumber: number;
  targetReps: number;
  actualReps: number | null;
  completed: boolean;
};
