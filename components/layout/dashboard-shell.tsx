import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { dashboardNav } from "@/lib/site";
import { getCurrentUser } from "@/lib/data/repository";
import { Logo } from "@/components/layout/logo";
import { SignOutButton } from "@/components/forms/sign-out-button";

export async function DashboardShell({
  role,
  title,
  description,
  children
}: {
  role: "doctor" | "facility" | "admin";
  title: string;
  description: string;
  children: ReactNode;
}) {
  const user = await getCurrentUser(role);
  if (!user || user.role !== role) notFound();

  return (
    <div className="min-h-screen bg-secondary/40">
      <div className="container grid gap-8 py-8 lg:grid-cols-[260px_1fr]">
        <aside className="surface h-fit p-5">
          <div className="space-y-6">
            <Logo />
            <div className="rounded-3xl bg-secondary p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Signed in as</p>
              <p className="mt-2 font-semibold">{user.full_name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <nav className="space-y-2">
              {dashboardNav[role].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-2xl px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <SignOutButton />
          </div>
        </aside>
        <main className="space-y-8">
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.18em] text-primary">Workspace</p>
            <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
            <p className="max-w-3xl text-muted-foreground">{description}</p>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
