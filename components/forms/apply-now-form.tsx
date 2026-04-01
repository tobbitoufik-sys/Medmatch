"use client";

import { useActionState, useEffect, useState } from "react";

import { applyToOfferAction } from "@/lib/actions";
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

export function ApplyNowForm({
  offerId,
  alreadyApplied
}: {
  offerId: string;
  alreadyApplied: boolean;
}) {
  const [state, formAction, pending] = useActionState(applyToOfferAction, initialState);
  const [applied, setApplied] = useState(alreadyApplied);

  useEffect(() => {
    if (state.success) {
      setApplied(true);
    }
  }, [state.success]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="offer_id" value={offerId} />
      <p className="text-sm text-muted-foreground">
        Ihre Bewerbung wird automatisch aus Ihrem MedMatch-Arztprofil erstellt und direkt an die Einrichtung übermittelt.
      </p>
      {state.message ? (
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm",
            state.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          )}
        >
          {state.message === "Application already submitted for this opportunity."
            ? "Bewerbung erfolgreich eingereicht"
            : state.message}
        </div>
      ) : null}
      <Button type="submit" className="w-full sm:w-auto" disabled={pending || applied}>
        {applied ? "Bereits beworben" : pending ? "Bitte warten..." : "Jetzt bewerben"}
      </Button>
    </form>
  );
}
