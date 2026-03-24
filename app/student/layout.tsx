import type { ReactNode } from "react";
import { requireRole } from "@/lib/auth";

export default async function StudentLayout({
  children
}: {
  children: ReactNode;
}) {
  await requireRole(["student", "admin", "instructor"]);
  return children;
}
