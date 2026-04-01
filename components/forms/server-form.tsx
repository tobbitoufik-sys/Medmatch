"use client";

import { useActionState, useEffect } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ActionState = {
  success: boolean;
  message: string;
};

const initialState: ActionState = {
  success: false,
  message: ""
};

export function ServerForm({
  action,
  submitLabel,
  children,
  className,
  refreshOnSuccess = false,
  pendingLabel,
  successRefreshDelayMs = 0
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  submitLabel: string;
  children: ReactNode;
  className?: string;
  refreshOnSuccess?: boolean;
  pendingLabel?: string;
  successRefreshDelayMs?: number;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, initialState);
  const refreshDelayMs = refreshOnSuccess ? successRefreshDelayMs : 0;

  useEffect(() => {
    if (refreshDelayMs > 0 && state.success) {
      const timeoutId = window.setTimeout(() => {
        router.refresh();
      }, refreshDelayMs);

      return () => window.clearTimeout(timeoutId);
    }
  }, [refreshDelayMs, router, state.success]);

  return (
    <form action={formAction} className={cn("space-y-6", className)}>
      {children}
      {state.message ? (
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm",
            state.success
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          )}
        >
          {state.message}
        </div>
      ) : null}
      <Button
        type="submit"
        formEncType="multipart/form-data"
        className="w-full sm:w-auto"
        disabled={pending}
      >
        {pending ? pendingLabel ?? "Please wait..." : submitLabel}
      </Button>
    </form>
  );
}
