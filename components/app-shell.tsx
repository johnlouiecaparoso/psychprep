"use client";

import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpenText,
  BrainCircuit,
  Download,
  FileSpreadsheet,
  LayoutDashboard,
  Layers3,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  User,
  UserRound,
  X
} from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";
import { UserMenu } from "@/components/auth/user-menu";
import { FloatingPomodoroWidget } from "@/components/study-technique/floating-pomodoro-widget";
import { PwaInstallGuide } from "@/components/pwa-install-guide";
import { createClient } from "@/lib/supabase/client";

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

const navByRole: Record<Role, NavItem[]> = {
  admin: [
    { href: "/admin", label: "Dashboard", icon: ShieldCheck },
    { href: "/admin/imports/exams", label: "Exam Imports", icon: FileSpreadsheet },
    { href: "/admin/imports/quizzes", label: "Quiz Imports", icon: Layers3 },
    { href: "/admin/imports/flashcards", label: "Flashcard Imports", icon: Layers3 },
    { href: "/admin/question-bank", label: "Question Bank", icon: Layers3 },
    { href: "/admin/reviewers", label: "Reviewer Library", icon: BookOpenText },
    { href: "/profile", label: "Profile", icon: UserRound }
  ],
  student: [
    { href: "/student", label: "Dashboard", icon: LayoutDashboard },
    { href: "/student/mock-exams", label: "Mock Exams", icon: BrainCircuit },
    { href: "/student/quiz", label: "Quick Quiz", icon: Layers3 },
    { href: "/student/flashcards", label: "Flashcards", icon: Layers3 },
    { href: "/student/reviewers", label: "Reviewers", icon: BookOpenText },
    { href: "/student/offline-downloads", label: "Offline Downloads", icon: Download }
  ]
};

function StudentSidebarActions() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => (typeof window === "undefined" ? null : createClient()), []);

  async function handleLogout() {
    if (!supabase) {
      return;
    }

    try {
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    }
  }

  const actionClassName = (href: string) =>
    cn(
      "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
      pathname === href ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
    );

  return (
    <div className="mt-4 space-y-2 border-t pt-4">
      <Link href="/profile" className={actionClassName("/profile")}>
        <User className="h-4 w-4" />
        Profile
      </Link>
      <Link href="/settings" className={actionClassName("/settings")}>
        <Settings className="h-4 w-4" />
        Settings
      </Link>
      <button
        type="button"
        onClick={() => void handleLogout()}
        className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
      >
        <LogOut className="h-4 w-4" />
        Logout
      </button>
    </div>
  );
}

export function AppShell({
  role,
  title,
  description,
  children
}: {
  role: Role;
  title: string;
  description: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  const sidebar = (
    <aside
      className={cn(
        "max-h-[calc(100vh-2rem)] overflow-y-auto rounded-[28px] border bg-card/95 p-5 text-card-foreground shadow-soft backdrop-blur",
        "lg:sticky lg:top-6 lg:block",
        isSidebarOpen ? "block" : "hidden lg:block"
      )}
    >
      <div className="mb-8 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-primary/10 p-3 text-primary">
            <BrainCircuit className="h-6 w-6" />
          </div>
          <div>
            <p className="text-lg font-bold">{APP_NAME}</p>
            <p className="text-sm text-muted-foreground capitalize">{role} portal</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsSidebarOpen(false)}
          className="rounded-xl border p-2 text-muted-foreground lg:hidden"
          aria-label="Close dashboard menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <nav className="space-y-2">
        {navByRole[role].map((item) => {
          const Icon = item.icon;
          const isSectionRoot = item.href === `/${role}`;
          const isActive = isSectionRoot
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href as any}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      {role === "student" ? <StudentSidebarActions /> : null}
      <div className="mt-8 rounded-2xl bg-secondary p-4 text-sm text-secondary-foreground">
        <div className="mb-2 flex items-center gap-2 font-semibold">
          <UserRound className="h-4 w-4" />
          {role === "student" ? "Study with structure" : "Manage learning content"}
        </div>
        {role === "student"
          ? "Use quizzes, mock exams, flashcards, and reviewer PDFs together to strengthen weak topics."
          : "Keep exam imports strict, reviewer PDFs organized, and analytics clear for every learner."}
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen">
      <div className="container-shell py-4 sm:py-6">
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <div className="hidden lg:block">{sidebar}</div>
          <main className="space-y-6">
            {role === "student" ? <PwaInstallGuide /> : null}
            <div className="rounded-[28px] border bg-card/90 p-5 text-card-foreground shadow-soft backdrop-blur sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => setIsSidebarOpen(true)}
                    className="rounded-2xl border p-3 text-muted-foreground lg:hidden"
                    aria-label="Open dashboard menu"
                  >
                    <Menu className="h-5 w-5" />
                  </button>
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
                    <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{description}</p>
                  </div>
                </div>
                <UserMenu role={role} />
              </div>
            </div>
            {children}
          </main>
        </div>
      </div>

      {isSidebarOpen ? (
        <div className="fixed inset-0 z-40 overflow-y-auto bg-slate-950/50 lg:hidden">
          <div className="min-h-full max-w-[300px] p-4">{sidebar}</div>
        </div>
      ) : null}

      {role === "student" ? <FloatingPomodoroWidget /> : null}
    </div>
  );
}
