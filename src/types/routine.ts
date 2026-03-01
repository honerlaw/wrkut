export type Exercise = {
  id: string;
  name: string;
  sets: number;
  reps: string;
  restSeconds: number | null;
  notes: string | null;
  sortOrder: number;
};

export type RoutineDay = {
  id: string;
  dayLabel: string;
  sortOrder: number;
  exercises: Exercise[];
};

export type Routine = {
  id: string;
  name: string;
  description: string | null;
  frequency: string | null;
  days: RoutineDay[];
  createdAt: string;
  updatedAt: string;
};

export type CreateRoutineInput = {
  name: string;
  description?: string;
  frequency?: string;
  days: {
    dayLabel: string;
    sortOrder: number;
    exercises: {
      name: string;
      sets: number;
      reps: string;
      restSeconds?: number;
      notes?: string;
      sortOrder: number;
    }[];
  }[];
};
