import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/data/repository";

export default async function DashboardAdminPage() {
  const user = await getCurrentUser("admin");

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "admin") {
    redirect("/dashboard");
  }

  redirect("/admin");
}
