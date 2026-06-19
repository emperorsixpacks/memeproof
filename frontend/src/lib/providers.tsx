"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StellarProvider } from "./stellar-provider";

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <StellarProvider>{children}</StellarProvider>
    </QueryClientProvider>
  );
}
