"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";
import { useAuthStore } from "@/stores/auth-store";
import {
  LayoutDashboard,
  Upload,
  BookOpen,
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
  DollarSign,
  HeartPulse,
  FlaskConical,
  TrendingUp,
  ChevronDown,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { useOnboardingStore, ONBOARDING_TOTAL_STEPS } from "@/stores/onboarding-store";

// ─── Grupos de navegação ───────────────────────────────────────────────────

const criarGroup = [
  { href: "/", label: "Início", icon: LayoutDashboard },
  { href: "/generate", label: "Criar Roteiro", icon: PenTool },
  { href: "/scripts", label: "Meus Roteiros", icon: FileText },
];

const aprenderGroup = [
  { href: "/youtube", label: "Meus Shorts", icon: Video },
  { href: "/analytics", label: "Análise do Canal", icon: BarChart3 },
  { href: "/insights", label: "Aprendizados", icon: Lightbulb },
  { href: "/ideas", label: "Próximos Vídeos", icon: Sparkles },
];

const bibliotecaGroup = [
  { href: "/library", label: "Referências", icon: BookOpen },
  { href: "/import", label: "Importar", icon: Upload },
  { href: "/styles", label: "Meu Estilo", icon: Palette },
];

const crescerGroup = [
  { href: "/experiments", label: "Experimentos", icon: FlaskConical },
  { href: "/strategy", label: "Estratégia", icon: TrendingUp },
];

const adminGroup = [
  { href: "/dashboard/ai-costs", label: "Processamentos IA", icon: DollarSign },
  { href: "/system/health", label: "Status do Sistema", icon: HeartPulse },
];

// ─── NavItem ───────────────────────────────────────────────────────────────

function NavItem({
  href,
  label,
  icon: Icon,
  pathname,
  sidebarOpen,
  badge,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  pathname: string;
  sidebarOpen: boolean;
  badge?: string;
}) {
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
  return (
    <Link
      href={href}
      className={cn(
        "relative flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "text-primary-foreground"
          : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
      data-testid={`nav-${href.replace(/\//g, "-").replace(/^-/, "") || "dashboard"}`}
      aria-label={label}
      title={!sidebarOpen ? label : undefined}
    >
      {active && (
        <span className="absolute inset-0 rounded-lg bg-primary shadow-sm transition-all duration-200" />
      )}
      <Icon className="relative h-4 w-4 shrink-0" />
      {sidebarOpen && (
        <span className="relative hidden sm:inline truncate flex-1">{label}</span>
      )}
      {badge && sidebarOpen && (
        <span className="relative hidden sm:inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 px-1.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
          {badge}
        </span>
      )}
      {badge && !sidebarOpen && (
        <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-amber-500" />
      )}
    </Link>
  );
}

// ─── NavGroup ──────────────────────────────────────────────────────────────

function NavGroup({
  label,
  items,
  pathname,
  sidebarOpen,
  itemBadges,
}: {
  label: string;
  items: { href: string; label: string; icon: React.ElementType }[];
  pathname: string;
  sidebarOpen: boolean;
  itemBadges?: Record<string, string>;
}) {
  return (
    <div>
      {sidebarOpen && (
        <span className="hidden px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 sm:block">
          {label}
        </span>
      )}
      <div className="flex flex-col gap-0.5">
        {items.map((item) => (
          <NavItem
            key={item.href}
            {...item}
            pathname={pathname}
            sidebarOpen={sidebarOpen}
            badge={itemBadges?.[item.href]}
          />
        ))}
      </div>
    </div>
  );
}

// ─── AdminSection — colapsável nativo ─────────────────────────────────────

function AdminSection({
  items,
  pathname,
  sidebarOpen,
}: {
  items: { href: string; label: string; icon: React.ElementType }[];
  pathname: string;
  sidebarOpen: boolean;
}) {
  const isAdminActive = items.some((item) => pathname.startsWith(item.href));
  const [open, setOpen] = useState(isAdminActive);

  return (
    <div>
      {sidebarOpen && (
        <span className="hidden px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 sm:block">
          Admin
        </span>
      )}
      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={cn(
          "flex w-full min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          isAdminActive && "text-foreground"
        )}
        title={!sidebarOpen ? "Operação / Admin" : undefined}
        aria-label="Operação"
        aria-expanded={open}
      >
        <HeartPulse className="h-4 w-4 shrink-0" />
        {sidebarOpen && (
          <>
            <span className="relative hidden sm:inline flex-1 text-left truncate">
              Operação
            </span>
            <ChevronDown
              className={cn(
                "hidden sm:block h-3.5 w-3.5 shrink-0 transition-transform duration-200",
                open && "rotate-180"
              )}
            />
          </>
        )}
      </button>

      {/* Itens admin — exibidos quando aberto */}
      {(open || !sidebarOpen) && (
        <div className={cn("flex flex-col gap-0.5", sidebarOpen && "pl-1")}>
          {items.map((item) => (
            <NavItem
              key={item.href}
              {...item}
              pathname={pathname}
              sidebarOpen={sidebarOpen}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Sidebar principal ─────────────────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme, sidebarOpen, setSidebarOpen } = useAppStore();
  const { logout, user } = useAuthStore();
  const onboarding = useOnboardingStore();

  // Badge de progresso do onboarding no item "Início"
  const onboardingProgress = onboarding.completed
    ? undefined
    : `${onboarding.currentStep}/${ONBOARDING_TOTAL_STEPS}`;

  return (
    <aside
      className={cn(
        "relative z-20 flex h-full shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar/95 shadow-[1px_0_0_rgba(255,255,255,0.02)] backdrop-blur transition-[width] duration-300",
        sidebarOpen ? "w-16 sm:w-60" : "w-16"
      )}
    >
      {/* Logo */}
      <div className="flex h-14 shrink-0 items-center gap-2.5 px-4">
        <Dna className="h-6 w-6 text-primary shrink-0" />
        {sidebarOpen && (
          <span className="hidden text-base font-bold tracking-tight sm:inline">
            ScriptDNA
          </span>
        )}
      </div>

      <Separator />

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-4 p-2 overflow-y-auto">
        <NavGroup
          label="Criar"
          items={criarGroup}
          pathname={pathname}
          sidebarOpen={sidebarOpen}
          itemBadges={onboardingProgress ? { "/": onboardingProgress } : undefined}
        />

        <NavGroup
          label="Aprender"
          items={aprenderGroup}
          pathname={pathname}
          sidebarOpen={sidebarOpen}
        />

        <NavGroup
          label="Biblioteca"
          items={bibliotecaGroup}
          pathname={pathname}
          sidebarOpen={sidebarOpen}
        />

        <NavGroup
          label="Crescer"
          items={crescerGroup}
          pathname={pathname}
          sidebarOpen={sidebarOpen}
        />

        <AdminSection
          items={adminGroup}
          pathname={pathname}
          sidebarOpen={sidebarOpen}
        />
      </nav>

      <Separator />

      {/* Footer */}
      <div className="p-2 flex flex-col gap-1">
        {/* Usuário */}
        {user && (
          <div
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2",
              !sidebarOpen && "justify-center"
            )}
            title={user.email}
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="h-3.5 w-3.5" />
            </div>
            {sidebarOpen && (
              <div className="hidden sm:block min-w-0">
                <p className="truncate text-xs font-medium leading-none">
                  {user.name ?? user.email}
                </p>
                {user.name && (
                  <p className="truncate text-[10px] text-muted-foreground mt-0.5">
                    {user.email}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tema */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="min-h-10 justify-start gap-3 text-muted-foreground"
          aria-label="Alternar tema"
          title={!sidebarOpen ? "Alternar tema" : undefined}
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4 shrink-0" />
          ) : (
            <Moon className="h-4 w-4 shrink-0" />
          )}
          {sidebarOpen && (
            <span className="hidden sm:inline">
              {theme === "dark" ? "Modo Claro" : "Modo Escuro"}
            </span>
          )}
        </Button>

        {/* Recolher/expandir */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="min-h-10 justify-start gap-3 text-muted-foreground"
          aria-label={sidebarOpen ? "Recolher menu" : "Expandir menu"}
          title={!sidebarOpen ? "Expandir menu" : undefined}
        >
          {sidebarOpen ? (
            <PanelLeftClose className="h-4 w-4 shrink-0" />
          ) : (
            <PanelLeft className="h-4 w-4 shrink-0" />
          )}
          {sidebarOpen && <span className="hidden sm:inline">Recolher</span>}
        </Button>

        {/* Sair */}
        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className="min-h-10 justify-start gap-3 text-muted-foreground hover:text-destructive"
          aria-label="Sair"
          title={!sidebarOpen ? "Sair" : undefined}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {sidebarOpen && <span className="hidden sm:inline">Sair</span>}
        </Button>
      </div>
    </aside>
  );
}
