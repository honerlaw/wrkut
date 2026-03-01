import { useMemo } from "react";

import { useUser } from "@/src/components/UserProvider";
import { createApiClient } from "@/src/utils/apiClient";

export function useApiClient() {
  const { userId } = useUser();
  return useMemo(() => (userId ? createApiClient({ userId }) : null), [userId]);
}
