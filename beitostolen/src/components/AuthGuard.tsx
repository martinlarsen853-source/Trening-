'use client';

// Auth temporarily disabled — open access
export function AuthGuard({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
