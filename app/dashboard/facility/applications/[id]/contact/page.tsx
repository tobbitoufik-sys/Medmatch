import { unstable_noStore as noStore } from "next/cache";
import { notFound, redirect } from "next/navigation";

import { ApplicationChatPanel } from "@/components/dashboard/application-chat-panel";
import { MarkConversationRead } from "@/components/dashboard/mark-conversation-read";
import { HardRefreshBackButton } from "@/components/dashboard/hard-refresh-back-button";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getFacilityVisibleApplicationStatus, applicationStatusBadgeClass, applicationStatusLabels, type ApplicationStatus } from "@/lib/applications";
import { getOrCreateConversationForFacility } from "@/lib/application-conversations";

export default async function FacilityApplicationContactPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  noStore();
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) notFound();

  const { data: facility } = await supabase
    .from("facility_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!facility) notFound();

  const { data: application } = await supabase
    .from("applications")
    .select("id")
    .eq("id", id)
    .eq("facility_id", facility.id)
    .maybeSingle();

  if (!application) notFound();

  const { count: contactEventsCount } = await supabase
    .from("contact_events")
    .select("id", { count: "exact", head: true })
    .eq("application_id", application.id);

  if ((contactEventsCount ?? 0) === 0) {
    redirect(`/dashboard/facility/applications/${id}`);
  }

  const context = await getOrCreateConversationForFacility(id, user.id);
  if (!context) {
    return (
      <DashboardShell
        role="facility"
        title="Doctor conversation"
        description="Discuss this application directly in a dedicated conversation."
      >
        <EmptyState
          title="Conversation not available yet"
          description="The contact page route is working, but the conversation context could not be loaded for this application yet."
          cta="Back to application"
          href={`/dashboard/facility/applications/${id}` as never}
        />
      </DashboardShell>
    );
  }

  const visibleStatus = getFacilityVisibleApplicationStatus(context.application.status as ApplicationStatus);

  const [{ data: doctor }, { data: offer }, { data: messages }] = await Promise.all([
    supabase.from("users").select("full_name").eq("id", context.application.doctor_user_id).maybeSingle(),
    supabase.from("job_offers").select("title").eq("id", context.application.offer_id).maybeSingle(),
    supabase
      .from("application_messages")
      .select("id, sender_user_id, content, created_at")
      .eq("conversation_id", context.conversation.id)
      .order("created_at", { ascending: true })
  ]);

  return (
    <DashboardShell
      role="facility"
      title={doctor?.full_name || "Doctor conversation"}
      description="Discuss this application directly in a dedicated conversation."
    >
      <div className="grid gap-6">
        <MarkConversationRead
          conversationId={context.conversation.id}
          role="facility"
          latestMessageAt={messages?.at(-1)?.created_at ?? null}
        />
        <HardRefreshBackButton applicationId={id} />

        <Card>
          <CardHeader className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <CardTitle>{doctor?.full_name || "Doctor"}</CardTitle>
                <p className="text-sm text-muted-foreground">{offer?.title || "Application conversation"}</p>
              </div>
              <Badge className={applicationStatusBadgeClass[visibleStatus]}>
                {applicationStatusLabels[visibleStatus]}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        <ApplicationChatPanel
          messages={messages ?? []}
          currentUserId={context.facilityUserId}
          doctorUserId={context.application.doctor_user_id}
          doctorName={doctor?.full_name || "Doctor"}
          facilityName={user.user_metadata.full_name || user.email || "Facility"}
          conversationId={context.conversation.id}
          redirectPath={`/dashboard/facility/applications/${context.application.id}/contact`}
        />
      </div>
    </DashboardShell>
  );
}
