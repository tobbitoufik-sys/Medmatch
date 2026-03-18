import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { getUsers } from "@/lib/data/repository";

export default async function AdminUsersPage() {
  const users = await getUsers();

  return (
    <DashboardShell
      role="admin"
      title="Users"
      description="Review all registered accounts and their current role."
    >
      <Table>
        <THead>
          <TR>
            <TH>Name</TH>
            <TH>Email</TH>
            <TH>Role</TH>
            <TH>Status</TH>
          </TR>
        </THead>
        <TBody>
          {users.map((user) => (
            <TR key={user.id}>
              <TD>{user.full_name}</TD>
              <TD>{user.email}</TD>
              <TD><Badge>{user.role}</Badge></TD>
              <TD>{user.is_active ? "Active" : "Suspended"}</TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </DashboardShell>
  );
}
