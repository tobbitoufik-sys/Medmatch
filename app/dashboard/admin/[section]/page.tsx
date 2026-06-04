import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/data/repository";

type DashboardAdminSectionPageProps = {
  params: Promise<{
    section: string;
  }>;
};

export default async function DashboardAdminSectionPage({ params }: DashboardAdminSectionPageProps) {
  const user = await getCurrentUser("admin");

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "admin") {
    redirect("/dashboard");
  }

  const { section } = await params;
  redirect(`/admin/${section}`);
}
