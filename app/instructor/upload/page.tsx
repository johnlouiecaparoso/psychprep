import { redirect } from "next/navigation";

export default function LegacyInstructorUploadPage() {
  redirect("/admin/imports/exams");
}
