"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { Loader2 } from "lucide-react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, hasHydrated, hydrate, fetchUser, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (hasHydrated && isAuthenticated && !user) {
      fetchUser();
    }
  }, [hasHydrated, isAuthenticated, user, fetchUser]);

  useEffect(() => {
    if (hasHydrated && !isAuthenticated && !isLoading) {
      router.replace("/login");
    }
  }, [hasHydrated, isAuthenticated, isLoading, router]);

  if (!hasHydrated || !isAuthenticated) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}
