"use client";

import type { Route } from "next";
import { useState } from "react";
import { useFormStatus } from "react-dom";

import {
  insertContactEvent,
  submitApplicationStatusTransitionAction
} from "@/lib/actions";
import {
  applicationStatusActionLabels,
  getFacilityVisibleApplicationStatus,
  type ApplicationStatus
} from "@/lib/applications";
import { normalizeJobOfferContractType } from "@/lib/job-offers";
import { Button } from "@/components/ui/button";

function getWorkflowState(status: ApplicationStatus) {
  switch (status) {
    case "received":
      return {
        actions: ["in_review"] as ApplicationStatus[],
        helperText: "Nächster Schritt: Prüfung starten"
      };
    case "in_review":
      return {
        actions: ["accepted", "rejected"] as ApplicationStatus[],
        helperText: "Wählen Sie das nächste Ergebnis der Prüfung."
      };
    case "contacted":
      return {
        actions: ["accepted", "rejected"] as ApplicationStatus[],
        helperText: "Wählen Sie das finale Ergebnis nach dem Kontakt."
      };
    case "accepted":
    case "rejected":
    case "submitted":
      return {
        actions: [] as ApplicationStatus[],
        helperText: ""
      };
  }
}

function WorkflowButton({
  nextStatus
}: {
  nextStatus: ApplicationStatus;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      name="next_status"
      value={nextStatus}
      variant={nextStatus === "rejected" ? "outline" : "default"}
      disabled={pending}
    >
      {applicationStatusActionLabels[nextStatus]}
    </Button>
  );
}

export function ApplicationStatusActions({
  applicationId,
  initialStatus,
  detailPath,
  contactPath,
  contractType
}: {
  applicationId: string;
  initialStatus: ApplicationStatus;
  detailPath: string;
  contactPath: Route;
  contractType: string | null | undefined;
}) {
  const [showAgreement, setShowAgreement] = useState(false);
  const visibleStatus = getFacilityVisibleApplicationStatus(initialStatus);
  const normalizedContractType = normalizeJobOfferContractType(contractType);

  const workflowState = getWorkflowState(visibleStatus);
  const canContact =
    visibleStatus === "in_review" || visibleStatus === "contacted" || visibleStatus === "accepted";
  const requiresAgreement = normalizedContractType === "befristet" || normalizedContractType === "unbefristet";

  return (
    <>
      <div className="space-y-4">
        {workflowState.helperText ? (
          <p className="text-sm text-muted-foreground">{workflowState.helperText}</p>
        ) : null}
        {canContact ? (
          <div>
            {requiresAgreement ? (
              <Button type="button" variant="secondary" onClick={() => setShowAgreement(true)}>
                Arzt kontaktieren
              </Button>
            ) : (
              <form action={insertContactEvent}>
                <input type="hidden" name="application_id" value={applicationId} />
                <input type="hidden" name="contact_path" value={contactPath} />
                <input type="hidden" name="contract_type" value={normalizedContractType} />
                <Button type="submit" variant="secondary">
                  Arzt kontaktieren
                </Button>
              </form>
            )}
          </div>
        ) : null}
        <form action={submitApplicationStatusTransitionAction} className="space-y-4">
          <input type="hidden" name="application_id" value={applicationId} />
          <input type="hidden" name="detail_path" value={detailPath} />
        {workflowState.actions.length ? (
          <div className="flex flex-wrap gap-3">
            {workflowState.actions.map((nextStatus) => (
              <WorkflowButton key={nextStatus} nextStatus={nextStatus} />
            ))}
          </div>
        ) : visibleStatus === "accepted" || visibleStatus === "rejected" ? (
          <p className="text-sm text-muted-foreground">Keine weiteren Aktionen für diese Bewerbung verfügbar.</p>
        ) : null}
        </form>
      </div>

      {showAgreement ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-[28px] border bg-white p-6 shadow-2xl">
            <div className="space-y-3">
              <h3 className="text-xl font-semibold">Beta-Hinweis</h3>
              <p className="text-sm leading-6 text-muted-foreground">
                Diese Funktion befindet sich aktuell in der Beta-Phase.
                Künftig kann eine Provision anfallen, wenn eine Einstellung über die Plattform zustande kommt.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setShowAgreement(false)}>
                Abbrechen
              </Button>
              <form action={insertContactEvent}>
                <input type="hidden" name="application_id" value={applicationId} />
                <input type="hidden" name="contact_path" value={contactPath} />
                <input type="hidden" name="contract_type" value={normalizedContractType} />
                <Button type="submit" variant="default">
                  Akzeptieren und fortfahren
                </Button>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
