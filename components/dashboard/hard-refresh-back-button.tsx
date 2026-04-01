"use client";

import { Button } from "@/components/ui/button";

export function HardRefreshBackButton({ applicationId }: { applicationId: string }) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => {
        window.location.assign(`/dashboard/facility/applications/${applicationId}`);
      }}
    >
      Back to application
    </Button>
  );
}
