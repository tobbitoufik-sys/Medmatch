import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { getDoctorProfiles, getFacilityProfiles } from "@/lib/data/repository";

export default async function AdminProfilesPage() {
  const [doctors, facilities] = await Promise.all([getDoctorProfiles(), getFacilityProfiles()]);

  return (
    <DashboardShell
      role="admin"
      title="Profiles"
      description="Review doctor and facility profiles, especially public visibility, completion and verification."
    >
      <div className="space-y-8">
        <div>
          <h2 className="mb-4 text-xl font-semibold">Doctor profiles</h2>
          <Table>
            <THead><TR><TH>Name</TH><TH>Specialty</TH><TH>Completion</TH><TH>Visibility</TH><TH>Verification</TH></TR></THead>
            <TBody>
              {doctors.map((doctor) => (
                <TR key={doctor.id}>
                  <TD>{doctor.title} {doctor.first_name} {doctor.last_name}</TD>
                  <TD>{doctor.specialty}</TD>
                  <TD>{doctor.profile_completion}%</TD>
                  <TD>{doctor.is_public ? "Public" : "Private"}</TD>
                  <TD>{doctor.verified ? <Badge>Verified</Badge> : "Pending"}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
        <div>
          <h2 className="mb-4 text-xl font-semibold">Facility profiles</h2>
          <Table>
            <THead><TR><TH>Facility</TH><TH>Type</TH><TH>Location</TH><TH>Verification</TH></TR></THead>
            <TBody>
              {facilities.map((facility) => (
                <TR key={facility.id}>
                  <TD>{facility.facility_name}</TD>
                  <TD>{facility.facility_type}</TD>
                  <TD>{facility.city}, {facility.country}</TD>
                  <TD>{facility.verified ? <Badge>Verified</Badge> : "Pending"}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      </div>
    </DashboardShell>
  );
}
