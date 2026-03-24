import type { ComponentType, ReactNode } from "react";
import Link from "next/link";
import { BrainCircuit, FileSpreadsheet, LayoutDashboard, Layers3, UserRound } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";

const navByRole: Record<Role, { href: string; label: string; icon: ComponentType<{ className?: string }> }[]> = {
  admin: [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/instructor/upload", label: "Imports", icon: FileSpreadsheet },
    { href: "/student/flashcards", label: "Learning", icon: Layers3 }
  ],
  instructor: [
    { href: "/instructor", label: "Dashboard", icon: LayoutDashboard },
    { href: "/instructor/upload", label: "Upload CSV", icon: FileSpreadsheet },
    { href: "/instructor/question-bank", label: "Question Bank", icon: Layers3 }
  ],
  student: [
    { href: "/student", label: "Dashboard", icon: LayoutDashboard },
    { href: "/student/mock-exams/exam-001", label: "Mock Exam", icon: BrainCircuit },
    { href: "/student/flashcards", label: "Flashcards", icon: Layers3 }
  ]
};

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
  return (
    <div className="min-h-screen">
      <div className="container-shell py-6">
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="rounded-[28px] border bg-white/90 p-5 shadow-soft backdrop-blur">
            <div className="mb-8 flex items-center gap-3">
              <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                <BrainCircuit className="h-6 w-6" />
              </div>
              <div>
                <p className="text-lg font-bold">{APP_NAME}</p>
                <p className="text-sm text-muted-foreground capitalize">{role} portal</p>
              </div>
            </div>
            <nav className="space-y-2">
              {navByRole[role].map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-muted hover:text-slate-950"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-8 rounded-2xl bg-secondary p-4 text-sm text-secondary-foreground">
              <div className="mb-2 flex items-center gap-2 font-semibold">
                <UserRound className="h-4 w-4" />
                Review smarter
              </div>
              Focus weak topics, run timed drills, and keep every upload clean with strict validation.
            </div>
          </aside>
          <main className="space-y-6">
            <div className="rounded-[28px] border bg-white/90 p-6 shadow-soft backdrop-blur">
              <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
              <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{description}</p>
            </div>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
