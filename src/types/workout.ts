export type WorkoutSet = {
  id: string;
  setNumber: number;
  targetReps: number;
  actualReps: number | null;
  completed: boolean;
};

export type WorkoutExercise = {
  exerciseId: string;
  exerciseName: string;
  restSeconds: number | null;
  sets: WorkoutSet[];
};

export type WorkoutSession = {
  id: string;
  routineId: string;
  routineDayId: string;
  status: string;
  startedAt: string;
  finishedAt: string | null;
  notes: string | null;
  exercises: WorkoutExercise[];
};
