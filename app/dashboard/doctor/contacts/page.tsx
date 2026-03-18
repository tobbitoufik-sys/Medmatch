import { DashboardShell } from "@/components/layout/dashboard-shell";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getContactRequests, getCurrentUser } from "@/lib/data/repository";

export default async function DoctorContactsPage() {
  const user = await getCurrentUser("doctor");
  const contacts = await getContactRequests();
  const myContacts = contacts.filter((item) => item.sender_user_id === user?.id);

  return (
    <DashboardShell
      role="doctor"
      title="My contact requests"
      description="Track simple applications and professional conversations started from the platform."
    >
      {myContacts.length ? (
        <div className="grid gap-6">
          {myContacts.map((contact) => (
            <Card key={contact.id}>
              <CardHeader><CardTitle>{contact.related_offer_title || "Direct outreach"}</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-muted-foreground">
                <p><span className="font-semibold text-foreground">To:</span> {contact.receiver_name}</p>
                <p><span className="font-semibold text-foreground">Status:</span> {contact.status}</p>
                <p>{contact.message}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="No contact requests yet" description="Once you reach out to facilities, your contact requests will appear here." />
      )}
    </DashboardShell>
  );
}
