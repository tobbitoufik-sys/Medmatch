import Link from "next/link";
import type { Route } from "next";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getFacilityConversationInbox } from "@/lib/application-conversations";
import { getCurrentUser } from "@/lib/data/repository";

function formatTime(value: string | null) {
  if (!value) return "";

  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}

export default async function FacilityContactsPage() {
  const user = await getCurrentUser("facility");
  const inbox = user ? await getFacilityConversationInbox(user.id) : [];

  return (
    <DashboardShell
      role="facility"
      title="Inbox"
      description="Follow active doctor conversations from one clear inbox."
    >
      {inbox.length ? (
        <div className="grid gap-4">
          {inbox.map((conversation) => (
            <Link
              key={conversation.conversationId}
              href={`/dashboard/facility/applications/${conversation.applicationId}/contact` as Route}
            >
              <Card className="cursor-pointer transition-colors hover:border-primary/40 hover:bg-secondary/20">
                <CardContent className="flex items-start justify-between gap-4 p-5">
                  <div className="min-w-0 space-y-2">
                    <div className="flex items-center gap-3">
                      <p className="font-semibold">{conversation.otherPartyLabel}</p>
                      {conversation.unread ? (
                        <Badge className="bg-primary text-primary-foreground">New</Badge>
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
          title="No conversations yet"
          description="Once you start contacting doctors, your application conversations will appear here."
        />
      )}
    </DashboardShell>
  );
}
