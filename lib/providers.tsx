"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import type React from "react";
import { useState } from "react";
import superjson from "superjson";
import { api } from "./api";

export function TRPCProvider({ children }: { children: React.ReactNode }) {
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
            const adminToken =
              typeof window !== "undefined"
                ? localStorage.getItem("adminToken")
                : null;
            return {
              ...(adminToken ? { "x-admin-token": adminToken } : {}),
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
