import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/data/repository";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role === "doctor") redirect("/dashboard/doctor");
  if (user.role === "facility") redirect("/dashboard/facility");
  redirect("/admin");
}
