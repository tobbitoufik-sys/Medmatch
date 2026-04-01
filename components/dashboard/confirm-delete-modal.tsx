"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function ConfirmDeleteModal({
  offerId,
  action
}: {
  offerId: string;
  action: (formData: FormData) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        Delete
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-md rounded-3xl border bg-white p-6 shadow-soft">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold tracking-tight">Delete offer?</h2>
              <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>

              <form action={action}>
                <input type="hidden" name="id" value={offerId} />
                <Button type="submit">Delete</Button>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
