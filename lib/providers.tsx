"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { type ReactNode, useState } from "react";
import superjson from "superjson";
import { api } from "./api";

export function TRPCProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 30,
            gcTime: 1000 * 60 * 60,
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            retry: 2,
            retryDelay: 1000,
          },
        },
      }),
  );

  const [trpcClient] = useState(() =>
    api.createClient({
      links: [
        httpBatchLink({
          url: "/api/trpc",
          transformer: superjson,
          headers() {
            if (typeof window === "undefined") return {};

            const adminToken = localStorage.getItem("adminToken");
            const userIdRaw = localStorage.getItem("userId");
            let userId: string | null = null;

            if (userIdRaw) {
              try {
                userId = JSON.parse(userIdRaw);
              } catch {
                userId = userIdRaw;
              }
            }

            return {
              ...(adminToken ? { "x-admin-token": adminToken } : {}),
              ...(userId ? { "x-user-id": String(userId) } : {}),
            };
          },
        }),
      ],
    }),
  );

  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </api.Provider>
  );
}
