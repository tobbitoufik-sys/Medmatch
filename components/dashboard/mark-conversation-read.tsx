"use client";

import { useEffect } from "react";

export function MarkConversationRead({
  conversationId,
  role,
  latestMessageAt
}: {
  conversationId: string;
  role: "doctor" | "facility";
  latestMessageAt: string | null;
}) {
  useEffect(() => {
    const key = `medmatch_${role}_conversation_seen_${conversationId}`;
    const value = latestMessageAt ?? new Date().toISOString();
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);

    document.cookie = `${key}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
  }, [conversationId, latestMessageAt, role]);

  return null;
}
