"use client";

import { ConfirmDeleteModal } from "./confirm-delete-modal";

export function ConfirmDeleteButton({
  offerId,
  action
}: {
  offerId: string;
  action: (formData: FormData) => Promise<void>;
}) {
  return <ConfirmDeleteModal offerId={offerId} action={action} />;
}
