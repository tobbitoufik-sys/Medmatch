import { notFound, redirect } from "next/navigation";

import { ApplicationChatPanel } from "@/components/dashboard/application-chat-panel";
import { MarkConversationRead } from "@/components/dashboard/mark-conversation-read";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { applicationStatusBadgeClass, applicationStatusLabels, type ApplicationStatus } from "@/lib/applications";
import { getOrCreateConversationForDoctor } from "@/lib/application-conversations";

export default async function DoctorApplicationContactPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) notFound();

  const { data: application } = await supabase
    .from("applications")
    .select("id, doctor_user_id, facility_id, offer_id, status, created_at, message")
    .eq("id", id)
    .eq("doctor_user_id", user.id)
    .maybeSingle();

  if (!application) notFound();

  const { data: existingConversation } = await supabase
    .from("application_conversations")
    .select("id, application_id, doctor_user_id, facility_user_id, created_at")
    .eq("application_id", application.id)
    .eq("doctor_user_id", user.id)
    .maybeSingle();

  const { count: contactEventsCount } = await supabase
    .from("contact_events")
    .select("id", { count: "exact", head: true })
    .eq("application_id", application.id);

  if ((contactEventsCount ?? 0) === 0 && !existingConversation?.id) {
    redirect(`/dashboard/doctor/opportunities/${application.offer_id}`);
  }

  const context =
    existingConversation
      ? {
          application,
          conversation: existingConversation,
          facilityUserId: existingConversation.facility_user_id
        }
      : await getOrCreateConversationForDoctor(id, user.id);

  if (!context) notFound();

  const [{ data: facilityUser }, { data: offer }, { data: messages }] = await Promise.all([
    supabase.from("users").select("full_name").eq("id", context.facilityUserId).maybeSingle(),
    supabase.from("job_offers").select("title").eq("id", context.application.offer_id).maybeSingle(),
    supabase
      .from("application_messages")
      .select("id, sender_user_id, content, created_at")
      .eq("conversation_id", context.conversation.id)
      .order("created_at", { ascending: true })
  ]);

  const status = context.application.status as ApplicationStatus;

  return (
    <DashboardShell
      role="doctor"
      title={facilityUser?.full_name || "Unterhaltung mit Einrichtung"}
      description="Besprechen Sie diese Bewerbung direkt in einer eigenen Unterhaltung."
    >
      <div className="grid gap-6">
        <MarkConversationRead
          conversationId={context.conversation.id}
          role="doctor"
          latestMessageAt={messages?.at(-1)?.created_at ?? null}
        />
        <Card>
          <CardHeader className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <CardTitle>{facilityUser?.full_name || "Einrichtung"}</CardTitle>
                <p className="text-sm text-muted-foreground">{offer?.title || "Bewerbungsunterhaltung"}</p>
              </div>
              <Badge className={applicationStatusBadgeClass[status]}>
                {applicationStatusLabels[status]}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        <ApplicationChatPanel
          messages={messages ?? []}
          currentUserId={context.application.doctor_user_id}
          doctorUserId={context.application.doctor_user_id}
          doctorName={user.user_metadata.full_name || user.email || "Arzt"}
          facilityName={facilityUser?.full_name || "Einrichtung"}
          conversationId={context.conversation.id}
          redirectPath={`/dashboard/doctor/applications/${context.application.id}/contact`}
        />
      </div>
    </DashboardShell>
  );
}
