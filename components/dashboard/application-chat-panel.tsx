"use client";

import { useEffect, useRef } from "react";

import { EmptyState } from "@/components/dashboard/empty-state";
import { ApplicationMessageForm } from "@/components/forms/application-message-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ApplicationChatMessage = {
  id: string;
  sender_user_id: string;
  content: string;
  created_at: string | null;
};

function formatMessageTime(value: string | null) {
  if (!value) return "";

  const date = new Date(value);
  const months = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = months[date.getUTCMonth()] ?? "";
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");

  return `${day} ${month} • ${hours}:${minutes}`;
}

export function ApplicationChatPanel({
  messages,
  currentUserId,
  doctorUserId,
  doctorName,
  facilityName,
  conversationId,
  redirectPath
}: {
  messages: ApplicationChatMessage[];
  currentUserId: string;
  doctorUserId: string;
  doctorName: string;
  facilityName: string;
  conversationId: string;
  redirectPath: string;
}) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-muted/20">
        <CardTitle>Unterhaltung</CardTitle>
      </CardHeader>

      <div className="flex h-[70vh] min-h-[34rem] flex-col">
        <CardContent className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          {messages.length ? (
            <div className="space-y-3">
              {messages.map((message) => {
                const isCurrentUser = message.sender_user_id === currentUserId;
                const senderName =
                  message.sender_user_id === doctorUserId ? doctorName : facilityName;

                return (
                  <div
                    key={message.id}
                    className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`w-full max-w-[70%] rounded-3xl px-4 py-3 shadow-sm ${
                        isCurrentUser
                          ? "bg-primary text-primary-foreground"
                          : "border bg-background"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium">{senderName}</p>
                        <p
                          className={`text-xs ${
                            isCurrentUser
                              ? "text-primary-foreground/80"
                              : "text-muted-foreground"
                          }`}
                        >
                          {formatMessageTime(message.created_at)}
                        </p>
                      </div>
                      <p
                        className={`mt-2 whitespace-pre-wrap break-words text-sm leading-6 sm:text-[15px] ${
                          isCurrentUser
                            ? "text-primary-foreground"
                            : "text-foreground"
                        }`}
                      >
                        {message.content}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          ) : (
            <div className="flex h-full items-center">
              <EmptyState
                title="Unterhaltung starten"
                description="Senden Sie die erste Nachricht, um die Unterhaltung zu beginnen."
              />
            </div>
          )}
        </CardContent>

        <div className="border-t bg-background/95 px-4 py-4 backdrop-blur sm:px-6">
          <ApplicationMessageForm
            conversationId={conversationId}
            redirectPath={redirectPath}
          />
        </div>
      </div>
    </Card>
  );
}
