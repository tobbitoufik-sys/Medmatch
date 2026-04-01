import Link from "next/link";
import type { Route } from "next";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getDoctorConversationInbox } from "@/lib/application-conversations";
import { getCurrentUser } from "@/lib/data/repository";

function formatTime(value: string | null) {
  if (!value) return "";

  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}

export default async function DoctorContactsPage() {
  const user = await getCurrentUser("doctor");
  const inbox = user ? await getDoctorConversationInbox(user.id) : [];

  inbox.forEach((conversation) => {
    console.log("[doctor-inbox] final href", {
      conversationId: conversation.conversationId,
      applicationId: conversation.applicationId,
      href: `/dashboard/doctor/applications/${conversation.applicationId}/contact`
    });
  });

  return (
    <DashboardShell
      role="doctor"
      title="Postfach"
      description="Behalten Sie alle Unterhaltungen mit Einrichtungen zu Ihren Bewerbungen im Blick."
    >
      {inbox.length ? (
        <div className="grid gap-4">
          {inbox.map((conversation) => (
            <Link
              key={conversation.conversationId}
              href={`/dashboard/doctor/applications/${conversation.applicationId}/contact` as Route}
            >
              <Card className="cursor-pointer transition-colors hover:border-primary/40 hover:bg-secondary/20">
                <CardContent className="flex items-start justify-between gap-4 p-5">
                  <div className="min-w-0 space-y-2">
                    <div className="flex items-center gap-3">
                      <p className="font-semibold">{conversation.otherPartyLabel}</p>
                      {conversation.unread ? (
                        <Badge className="bg-primary text-primary-foreground">Neu</Badge>
                      ) : null}
                    </div>
                    <p className="text-sm text-muted-foreground">{conversation.offerTitle}</p>
                    <p className="truncate text-sm text-foreground/80">
                      {conversation.latestMessagePreview}
                    </p>
                  </div>
                  <p className="shrink-0 text-xs text-muted-foreground">
                    {formatTime(conversation.latestMessageAt)}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Noch keine Unterhaltungen"
          description="Sobald eine Einrichtung zu einer Ihrer Bewerbungen eine Unterhaltung eröffnet, erscheint sie hier."
        />
      )}
    </DashboardShell>
  );
}
