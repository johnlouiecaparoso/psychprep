import { redirect } from "next/navigation";
import { getUserProfile } from "@/lib/auth";

export default async function DashboardRedirectPage() {
  const profile = await getUserProfile();

  if (!profile) {
    redirect("/login");
  }

  switch (profile.role) {
    case "admin":
      redirect("/admin");
    case "instructor":
      redirect("/instructor");
    case "student":
    default:
      redirect("/student");
  }
}
