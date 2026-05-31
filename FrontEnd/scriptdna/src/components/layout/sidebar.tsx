"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";
import {
  LayoutDashboard,
  Upload,
  Library,
  Palette,
  PenTool,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeft,
  Dna,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/import", label: "Importar", icon: Upload },
  { href: "/library", label: "Biblioteca", icon: Library },
  { href: "/styles", label: "Estilos", icon: Palette },
  { href: "/generate", label: "Gerar Roteiro", icon: PenTool },
];

export function Sidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme, sidebarOpen, setSidebarOpen } = useAppStore();

  return (
    <aside
      className={cn(
        "relative z-20 flex h-full shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar/95 shadow-[1px_0_0_rgba(255,255,255,0.02)] backdrop-blur transition-[width] duration-300",
        sidebarOpen ? "w-16 sm:w-64" : "w-16"
      )}
    >
      <div className="flex h-16 shrink-0 items-center gap-2 px-4">
        <Dna className="h-7 w-7 text-primary shrink-0" />
        {sidebarOpen && (
          <span className="hidden text-lg font-bold tracking-tight sm:inline">
            ScriptDNA
          </span>
        )}
      </div>

      <Separator />

      <nav className="flex-1 flex flex-col gap-1 p-2 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "text-primary-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
              data-testid={`nav-${href.replace("/", "") || "dashboard"}`}
              aria-label={label}
              title={label}
            >
              {active && (
                <span
                  className="absolute inset-0 rounded-lg bg-primary shadow-sm transition-all duration-200"
                />
              )}
              <Icon className="relative h-5 w-5 shrink-0" />
              {sidebarOpen && <span className="relative hidden sm:inline">{label}</span>}
            </Link>
          );
        })}
      </nav>

      <Separator />

      <div className="p-2 flex flex-col gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="min-h-11 justify-start gap-3"
          aria-label="Alternar tema"
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5 shrink-0" />
          ) : (
            <Moon className="h-5 w-5 shrink-0" />
          )}
          {sidebarOpen && (
            <span className="hidden sm:inline">
              {theme === "dark" ? "Modo Claro" : "Modo Escuro"}
            </span>
          )}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="min-h-11 justify-start gap-3"
          aria-label={sidebarOpen ? "Recolher sidebar" : "Expandir sidebar"}
        >
          {sidebarOpen ? (
            <PanelLeftClose className="h-5 w-5 shrink-0" />
          ) : (
            <PanelLeft className="h-5 w-5 shrink-0" />
          )}
          {sidebarOpen && <span className="hidden sm:inline">Recolher</span>}
        </Button>
      </div>
    </aside>
  );
}
