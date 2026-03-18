import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { getContactRequests } from "@/lib/data/repository";

export default async function AdminContactsPage() {
  const contacts = await getContactRequests();

  return (
    <DashboardShell
      role="admin"
      title="Contact requests"
      description="Observe the volume and quality of professional outreach happening on the platform."
    >
      <Table>
        <THead>
          <TR>
            <TH>From</TH>
            <TH>To</TH>
            <TH>Offer</TH>
            <TH>Status</TH>
            <TH>Message</TH>
          </TR>
        </THead>
        <TBody>
          {contacts.map((contact) => (
            <TR key={contact.id}>
              <TD>{contact.sender_name || contact.sender_user_id}</TD>
              <TD>{contact.receiver_name || contact.receiver_user_id}</TD>
              <TD>{contact.related_offer_title || "Direct outreach"}</TD>
              <TD>{contact.status}</TD>
              <TD>{contact.message}</TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </DashboardShell>
  );
}
