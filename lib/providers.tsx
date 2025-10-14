"use client";

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  // Provider semplificato: non serve più trpc/react-query
  return <>{children}</>;
}
