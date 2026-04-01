import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { getJobOffers } from "@/lib/data/repository";
import { getJobOfferContractTypeLabel } from "@/lib/job-offers";

export default async function AdminOffersPage() {
  const offers = await getJobOffers();

  return (
    <DashboardShell
      role="admin"
      title="Offers"
      description="Monitor the published roles and identify offers that may need moderation or pausing."
    >
      <Table>
        <THead>
          <TR>
            <TH>Title</TH>
            <TH>Facility</TH>
            <TH>Location</TH>
            <TH>Contract</TH>
            <TH>Status</TH>
          </TR>
        </THead>
        <TBody>
          {offers.map((offer) => (
            <TR key={offer.id}>
              <TD>{offer.title}</TD>
              <TD>{offer.facility?.facility_name || "Facility"}</TD>
              <TD>{offer.city}, {offer.country}</TD>
              <TD>{getJobOfferContractTypeLabel(offer.contract_type)}</TD>
              <TD><Badge>{offer.status}</Badge></TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </DashboardShell>
  );
}
