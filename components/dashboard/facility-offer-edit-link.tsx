"use client";

import Link from "next/link";
import type { Route } from "next";
import type { MouseEvent } from "react";

import { Button } from "@/components/ui/button";

export function FacilityOfferEditLink({ offerId }: { offerId: string }) {
  const href = `/dashboard/facility/offers/${offerId}/edit` as Route;

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.stopPropagation();
  };

  return (
    <Button asChild size="sm" variant="outline">
      <Link href={href} onClick={handleClick}>
        Edit
      </Link>
    </Button>
  );
}
