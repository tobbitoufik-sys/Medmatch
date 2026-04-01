"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import { sendApplicationMessageAction } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending || disabled} className="w-full shrink-0 sm:w-auto">
      {pending ? "Sending..." : "Send"}
    </Button>
  );
}

export function ApplicationMessageForm({
  conversationId,
  redirectPath
}: {
  conversationId: string;
  redirectPath: string;
}) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [content, setContent] = useState("");
  const trimmedContent = content.trim();

  return (
    <form
      ref={formRef}
      action={sendApplicationMessageAction}
      className="flex items-end gap-3"
      onSubmit={(event) => {
        if (!trimmedContent) {
          event.preventDefault();
          return;
        }

        setContent("");
      }}
    >
      <input type="hidden" name="conversation_id" value={conversationId} />
      <input type="hidden" name="redirect_path" value={redirectPath} />
      <input type="hidden" name="content" value={trimmedContent} />
      <Textarea
        placeholder="Type a message"
        required
        minLength={2}
        className="min-h-[56px] flex-1 resize-none rounded-3xl px-4 py-3"
        rows={1}
        value={content}
        onChange={(event) => setContent(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();

            if (!trimmedContent) {
              return;
            }

            formRef.current?.requestSubmit();
          }
        }}
      />
      <SubmitButton disabled={!trimmedContent} />
    </form>
  );
}
