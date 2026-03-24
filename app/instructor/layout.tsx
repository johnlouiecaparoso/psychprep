import type { ReactNode } from "react";
import { requireRole } from "@/lib/auth";

export default async function InstructorLayout({
  children
}: {
  children: ReactNode;
}) {
  await requireRole(["admin", "instructor"]);
  return children;
}
