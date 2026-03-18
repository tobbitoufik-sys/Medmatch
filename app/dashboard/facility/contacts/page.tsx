import { DashboardShell } from "@/components/layout/dashboard-shell";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getContactRequests, getCurrentUser } from "@/lib/data/repository";

export default async function FacilityContactsPage() {
  const user = await getCurrentUser("facility");
  const contacts = await getContactRequests();
  const inbound = contacts.filter((item) => item.receiver_user_id === user?.id);

  return (
    <DashboardShell
      role="facility"
      title="Inbound contact requests"
      description="Review doctor outreach and early-stage interest from one place."
    >
      {inbound.length ? (
        <div className="grid gap-6">
          {inbound.map((contact) => (
            <Card key={contact.id}>
              <CardHeader><CardTitle>{contact.sender_name || "Doctor contact"}</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-muted-foreground">
                <p><span className="font-semibold text-foreground">Status:</span> {contact.status}</p>
                <p><span className="font-semibold text-foreground">Related offer:</span> {contact.related_offer_title || "Direct outreach"}</p>
                <p>{contact.message}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="No inbound contact yet" description="Doctor outreach will appear here once they start contacting your facility." />
      )}
    </DashboardShell>
  );
}
