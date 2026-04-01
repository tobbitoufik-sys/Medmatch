import Link from "next/link";
import { getCurrentUser } from "@/lib/data/repository";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  return (
    <div className="container py-16 space-y-4">
      <h1 className="text-3xl font-semibold">Dashboard</h1>
      {user ? (
        <>
          <p>Signed in as {user.full_name}.</p>
          <p>Your account role is {user.role}.</p>
          {user.role === "doctor" ? <Link href="/dashboard/doctor">Open doctor dashboard</Link> : null}
          {user.role === "facility" ? <Link href="/dashboard/facility">Open facility dashboard</Link> : null}
          {user.role === "admin" ? <Link href="/admin">Open admin dashboard</Link> : null}
        </>
      ) : (
        <p>Your session is being resolved. Stay on this page instead of being redirected back to login.</p>
      )}
    </div>
  );
}
