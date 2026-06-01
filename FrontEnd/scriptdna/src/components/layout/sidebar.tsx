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
  FileText,
  Video,
  BarChart3,
  Lightbulb,
  Sparkles,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/stores/auth-store";

const mainNavItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/scripts", label: "Roteiros", icon: FileText },
  { href: "/youtube", label: "YouTube", icon: Video },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/insights", label: "Insights", icon: Lightbulb },
  { href: "/ideas", label: "Sugestoes", icon: Sparkles },
];

const toolsNavItems = [
  { href: "/library", label: "Biblioteca", icon: Library },
  { href: "/import", label: "Importar", icon: Upload },
  { href: "/generate", label: "Gerador", icon: PenTool },
  { href: "/styles", label: "Estilos", icon: Palette },
];

function NavItem({
  href,
  label,
  icon: Icon,
  pathname,
  sidebarOpen,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  pathname: string;
  sidebarOpen: boolean;
}) {
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
  return (
    <Link
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
        <span className="absolute inset-0 rounded-lg bg-primary shadow-sm transition-all duration-200" />
      )}
      <Icon className="relative h-5 w-5 shrink-0" />
      {sidebarOpen && <span className="relative hidden sm:inline">{label}</span>}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme, sidebarOpen, setSidebarOpen } = useAppStore();
  const logout = useAuthStore((s) => s.logout);

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
        {mainNavItems.map((item) => (
          <NavItem key={item.href} {...item} pathname={pathname} sidebarOpen={sidebarOpen} />
        ))}

        <Separator className="my-2" />

        {sidebarOpen && (
          <span className="hidden px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:inline">
            Ferramentas
          </span>
        )}

        {toolsNavItems.map((item) => (
          <NavItem key={item.href} {...item} pathname={pathname} sidebarOpen={sidebarOpen} />
        ))}
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

        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className="min-h-11 justify-start gap-3 text-muted-foreground hover:text-destructive"
          aria-label="Sair"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {sidebarOpen && <span className="hidden sm:inline">Sair</span>}
        </Button>
      </div>
    </aside>
  );
}
