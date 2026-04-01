"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import type { JobOffer } from "@/types";
import { FacilityOfferEditLink } from "@/components/dashboard/facility-offer-edit-link";

export function FacilityOfferCard({ offer }: { offer: JobOffer }) {
  const router = useRouter();
  const href = `/dashboard/facility/offers/${offer.id}` as Route;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => router.push(href)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          router.push(href);
        }
      }}
      className="block rounded-2xl border p-4 transition-colors hover:bg-secondary/40 cursor-pointer"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold">{offer.title}</p>
          <p className="text-sm text-muted-foreground">{offer.city}, {offer.country}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge>{offer.status}</Badge>
          <FacilityOfferEditLink offerId={offer.id} />
        </div>
      </div>
    </div>
  );
}
