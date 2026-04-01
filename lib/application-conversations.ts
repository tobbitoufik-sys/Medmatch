import type { Route } from "next";
import { cookies } from "next/headers";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";

type ConversationRecord = {
  id: string;
  application_id: string;
  doctor_user_id: string;
  facility_user_id: string;
  created_at: string;
};

type MessageRecord = {
  id: string;
  conversation_id: string;
  sender_user_id: string;
  content: string;
  created_at: string | null;
};

export type ConversationInboxItem = {
  conversationId: string;
  applicationId: string;
  href: Route;
  otherPartyLabel: string;
  offerTitle: string;
  latestMessagePreview: string;
  latestMessageAt: string | null;
  unread: boolean;
};

type ConversationContext = {
  application: {
    id: string;
    doctor_user_id: string;
    facility_id: string;
    offer_id: string;
    status: string;
    created_at: string;
    message: string;
  };
  conversation: {
    id: string;
    application_id: string;
    doctor_user_id: string;
    facility_user_id: string;
    created_at: string;
  };
  facilityUserId: string;
};

export async function getOrCreateConversationForFacility(applicationId: string, userId: string): Promise<ConversationContext | null> {
  const supabase = await createServerSupabaseClient();
  const { data: facility } = await supabase
    .from("facility_profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!facility) return null;

  const { data: application } = await supabase
    .from("applications")
    .select("id, doctor_user_id, facility_id, offer_id, status, created_at, message")
    .eq("id", applicationId)
    .eq("facility_id", facility.id)
    .maybeSingle();

  if (!application) return null;

  const conversation = await getOrCreateConversation(application.id, application.doctor_user_id, userId);

  if (!conversation) return null;

  return {
    application,
    conversation,
    facilityUserId: userId
  };
}

export async function getOrCreateConversationForDoctor(applicationId: string, userId: string): Promise<ConversationContext | null> {
  const supabase = await createServerSupabaseClient();
  const { data: application } = await supabase
    .from("applications")
    .select("id, doctor_user_id, facility_id, offer_id, status, created_at, message")
    .eq("id", applicationId)
    .eq("doctor_user_id", userId)
    .maybeSingle();

  if (!application) return null;

  const { data: facility } = await supabase
    .from("facility_profiles")
    .select("user_id")
    .eq("id", application.facility_id)
    .maybeSingle();

  if (!facility) return null;

  const conversation = await getOrCreateConversation(application.id, application.doctor_user_id, facility.user_id);

  if (!conversation) return null;

  return {
    application,
    conversation,
    facilityUserId: facility.user_id
  };
}

async function getOrCreateConversation(applicationId: string, doctorUserId: string, facilityUserId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: existingConversation } = await supabase
    .from("application_conversations")
    .select("id, application_id, doctor_user_id, facility_user_id, created_at")
    .eq("application_id", applicationId)
    .maybeSingle();

  if (existingConversation) {
    console.log("[application-conversations] conversation found", {
      applicationId,
      conversationId: existingConversation.id
    });
    return existingConversation;
  }

  const { data: insertedConversation, error: insertError } = await supabase
    .from("application_conversations")
    .insert({
      application_id: applicationId,
      doctor_user_id: doctorUserId,
      facility_user_id: facilityUserId
    })
    .select("id, application_id, doctor_user_id, facility_user_id, created_at")
    .maybeSingle();

  if (insertedConversation) {
    console.log("[application-conversations] conversation created", {
      applicationId,
      conversationId: insertedConversation.id
    });
    return insertedConversation;
  }

  if (insertError) {
    console.error("[application-conversations] conversation create failed", {
      applicationId,
      code: insertError.code ?? null,
      message: insertError.message ?? null,
      details: insertError.details ?? null,
      hint: insertError.hint ?? null,
      error: insertError
    });
  }

  const { data: fallbackConversation } = await supabase
    .from("application_conversations")
    .select("id, application_id, doctor_user_id, facility_user_id, created_at")
    .eq("application_id", applicationId)
    .maybeSingle();

  console.log("[application-conversations] conversation fallback lookup", {
    applicationId,
    conversationId: fallbackConversation?.id ?? null
  });

  return fallbackConversation ?? null;
}

async function getConversationInbox(
  role: "doctor" | "facility",
  userId: string
): Promise<ConversationInboxItem[]> {
  if (!hasSupabaseEnv()) return [];

  const supabase = await createServerSupabaseClient();
  const cookieStore = await cookies();
  const conversationQuery =
    role === "facility"
      ? supabase
          .from("application_conversations")
          .select("id, application_id, doctor_user_id, facility_user_id, created_at")
          .eq("facility_user_id", userId)
      : supabase
          .from("application_conversations")
          .select("id, application_id, doctor_user_id, facility_user_id, created_at")
          .eq("doctor_user_id", userId);

  const { data: conversations, error: conversationsError } = await conversationQuery.order("created_at", { ascending: false });
  const typedConversations = (conversations as ConversationRecord[] | null) ?? [];

  console.log("[conversation-inbox] base query", {
    role,
    userId,
    count: typedConversations.length,
    error: conversationsError?.message ?? null
  });

  if (!typedConversations.length) return [];

  const applicationIds = typedConversations.map((conversation) => conversation.application_id);
  const otherUserIds = typedConversations.map((conversation) =>
    role === "facility" ? conversation.doctor_user_id : conversation.facility_user_id
  );
  const conversationIds = typedConversations.map((conversation) => conversation.id);

  const [{ data: applications, error: applicationsError }, { data: users, error: usersError }, { data: latestMessages, error: latestMessagesError }] = await Promise.all([
    supabase
      .from("applications")
      .select("id, offer_id")
      .in("id", applicationIds),
    supabase
      .from("users")
      .select("id, full_name")
      .in("id", otherUserIds),
    supabase
      .from("application_messages")
      .select("id, conversation_id, sender_user_id, content, created_at")
      .in("conversation_id", conversationIds)
      .order("created_at", { ascending: false })
  ]);

  console.log("[conversation-inbox] related query results", {
    role,
    userId,
    applicationCount: applications?.length ?? 0,
    applicationsError: applicationsError?.message ?? null,
    userCount: users?.length ?? 0,
    usersError: usersError?.message ?? null,
    latestMessageCount: latestMessages?.length ?? 0,
    latestMessagesError: latestMessagesError?.message ?? null
  });

  const applicationRows = applications ?? [];
  const applicationMap = new Map(applicationRows.map((application) => [application.id, application]));
  const offerIds = applicationRows.map((application) => application.offer_id);

  const { data: offers } = offerIds.length
    ? await supabase.from("job_offers").select("id, title").in("id", offerIds)
    : { data: [] as { id: string; title: string }[] };

  const userMap = new Map((users ?? []).map((user) => [user.id, user.full_name]));
  const offerMap = new Map(((offers as { id: string; title: string }[] | null) ?? []).map((offer) => [offer.id, offer.title]));
  const latestMessageMap = new Map<string, MessageRecord>();
  const latestOwnMessageTimeMap = new Map<string, number>();

  for (const message of ((latestMessages as MessageRecord[] | null) ?? [])) {
    if (!latestMessageMap.has(message.conversation_id)) {
      latestMessageMap.set(message.conversation_id, message);
    }

    if (
      message.sender_user_id === userId &&
      message.created_at &&
      !latestOwnMessageTimeMap.has(message.conversation_id)
    ) {
      latestOwnMessageTimeMap.set(
        message.conversation_id,
        new Date(message.created_at).getTime()
      );
    }
  }

  const inboxItems: ConversationInboxItem[] = [];

  for (const conversation of typedConversations) {
      const application = applicationMap.get(conversation.application_id);
      const otherUserId =
        role === "facility" ? conversation.doctor_user_id : conversation.facility_user_id;
      const latestMessage = latestMessageMap.get(conversation.id);
      const latestOwnMessageTime = latestOwnMessageTimeMap.get(conversation.id) ?? 0;
      const seenCookieValue = cookieStore
        .get(`medmatch_${role}_conversation_seen_${conversation.id}`)
        ?.value;
      const latestSeenTime = seenCookieValue ? new Date(seenCookieValue).getTime() : 0;
      const unreadThreshold = Math.max(latestOwnMessageTime, latestSeenTime);
      const isUnread = Boolean(
        latestMessage &&
          latestMessage.sender_user_id !== userId &&
          new Date(latestMessage.created_at ?? 0).getTime() > unreadThreshold
      );
      const skipReason = null;

      inboxItems.push({
        conversationId: conversation.id,
        applicationId: conversation.application_id,
        href:
          role === "facility"
            ? (`/dashboard/facility/applications/${conversation.application_id}/contact` as Route)
            : (`/dashboard/doctor/applications/${conversation.application_id}/contact` as Route),
        otherPartyLabel:
          userMap.get(otherUserId) || (role === "facility" ? "Doctor" : "Facility"),
        offerTitle: application ? offerMap.get(application.offer_id) || "Application conversation" : "Application conversation",
        latestMessagePreview: latestMessage?.content || "Start the conversation",
        latestMessageAt: latestMessage?.created_at ?? conversation.created_at,
        unread: isUnread
      });

      console.log("[conversation-inbox] row", {
        role,
        userId,
        conversationId: conversation.id,
        applicationId: conversation.application_id,
        applicationLookupSucceeded: Boolean(application),
        latestMessageLookupSucceeded: Boolean(latestMessage),
        unread: isUnread,
        included: true,
        skipReason
      });
    }

  return inboxItems.sort((left, right) => {
      const leftTime = left.latestMessageAt ? new Date(left.latestMessageAt).getTime() : 0;
      const rightTime = right.latestMessageAt ? new Date(right.latestMessageAt).getTime() : 0;
      return rightTime - leftTime;
    });
}

export async function getFacilityConversationInbox(userId: string) {
  return getConversationInbox("facility", userId);
}

export async function getDoctorConversationInbox(userId: string) {
  return getConversationInbox("doctor", userId);
}

export async function getUnreadConversationCount(role: "doctor" | "facility", userId: string) {
  const inbox = await getConversationInbox(role, userId);
  return inbox.filter((item) => item.unread).length;
}
