"use client";

import { Sidebar } from "./sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
