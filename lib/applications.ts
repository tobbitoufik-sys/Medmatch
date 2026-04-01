import type { ApplicationRecord } from "@/types";

export type ApplicationStatus = ApplicationRecord["status"];

export const applicationStatusOrder: ApplicationStatus[] = [
  "submitted",
  "received",
  "in_review",
  "contacted",
  "accepted",
  "rejected"
];

export const applicationStatusTransitions: Record<ApplicationStatus, ApplicationStatus[]> = {
  submitted: ["received"],
  received: ["in_review"],
  in_review: ["contacted", "accepted", "rejected"],
  contacted: ["accepted", "rejected"],
  accepted: [],
  rejected: []
};

export const applicationStatusLabels: Record<ApplicationStatus, string> = {
  submitted: "Submitted",
  received: "Received",
  in_review: "In review",
  contacted: "Contacted",
  accepted: "Accepted",
  rejected: "Rejected"
};

export const applicationStatusBadgeClass: Record<ApplicationStatus, string> = {
  submitted: "bg-secondary text-secondary-foreground",
  received: "bg-sky-100 text-sky-800",
  in_review: "bg-amber-100 text-amber-800",
  contacted: "bg-indigo-100 text-indigo-800",
  accepted: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800"
};

export const applicationStatusActionLabels: Record<ApplicationStatus, string> = {
  submitted: "Submitted",
  received: "Mark as received",
  in_review: "Start review",
  contacted: "Contact doctor",
  accepted: "Accept",
  rejected: "Reject"
};

export function getFacilityVisibleApplicationStatus(rawStatus: ApplicationStatus): ApplicationStatus {
  switch (rawStatus) {
    case "submitted":
      return "received";
    case "received":
      return "received";
    case "in_review":
      return "in_review";
    case "contacted":
      return "contacted";
    case "accepted":
      return "accepted";
    case "rejected":
      return "rejected";
  }
}

export const getFacilityWorkflowStatus = getFacilityVisibleApplicationStatus;
