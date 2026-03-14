import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router";
import {
  Briefcase,
  BrainCircuit,
  Code2,
  FileText,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Send,
  Settings2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet";

type NavItem = {
  to: string;
  icon: LucideIcon;
  label: string;
};

const navItems: NavItem[] = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/portfolios", icon: Briefcase, label: "Portfolios" },
  { to: "/llm-configs", icon: Settings2, label: "LLM Configs" },
  { to: "/templates", icon: FileText, label: "Templates" },
  { to: "/snippets", icon: Code2, label: "Snippets" },
  { to: "/requests", icon: Send, label: "Run Builder" },
  { to: "/responses", icon: MessageSquare, label: "Responses" },
];

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-3">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          end={item.to === "/"}
          to={item.to}
          onClick={onNavigate}
          className={({ isActive }) =>
            [
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            ].join(" ")
          }
        >
          <item.icon className="size-4 shrink-0" />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const activeItem = useMemo(
    () =>
      navItems.find((item) =>
        item.to === "/"
          ? location.pathname === "/"
          : location.pathname.startsWith(item.to),
      ) ?? navItems[0],
    [location.pathname],
  );

  return (
    <div className="flex h-svh flex-col overflow-hidden bg-background md:flex-row">
      <aside className="hidden shrink-0 border-r border-border bg-card/80 backdrop-blur md:flex md:h-svh md:w-64 md:flex-col">
        <div className="flex h-14 items-center gap-3 border-b border-border px-4">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <BrainCircuit className="size-5 shrink-0" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-tight">Stock Analysis AI</p>
            <p className="text-xs text-muted-foreground">Workspace</p>
          </div>
        </div>

        <SidebarNav />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-80 p-0 sm:max-w-none">
          <SheetHeader className="border-b border-border text-left">
            <SheetTitle className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <BrainCircuit className="size-5" />
              </div>
              <span>Stock Analysis AI</span>
            </SheetTitle>
            <SheetDescription>Navigate between all seven workspace routes.</SheetDescription>
          </SheetHeader>
          <div className="flex h-full flex-col">
            <SidebarNav onNavigate={() => setMobileOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur md:hidden">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Workspace</p>
            <p className="truncate text-sm font-medium">{activeItem.label}</p>
          </div>
          <Button
            size="icon"
            type="button"
            variant="outline"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="size-4" />
            <span className="sr-only">Open navigation</span>
          </Button>
        </header>

        <main className="min-h-0 min-w-0 flex-1">
          <ScrollArea className="h-full">
            <div className="min-h-full [&>*]:mx-auto [&>*]:w-full">
              <Outlet />
            </div>
          </ScrollArea>
        </main>
      </div>
    </div>
  );
}
