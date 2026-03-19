import type { Route } from "next";
import type { UserRole } from "@/types";

export const siteConfig = {
  name: "MedMatch",
  description:
    "Premium recruitment platform connecting doctors with hospitals and clinics."
};

export const navLinks: { href: Route; label: string }[] = [
  { href: "/", label: "Home" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/for-doctors", label: "For doctors" },
  { href: "/for-facilities", label: "For facilities" },
  { href: "/opportunities", label: "Opportunities" },
  { href: "/doctors", label: "Doctors" },
  { href: "/contact", label: "Contact" }
];

export const dashboardNav: Record<UserRole, { href: Route; label: string }[]> = {
  doctor: [
    { href: "/dashboard/doctor", label: "Overview" },
    { href: "/dashboard/doctor/profile", label: "Profile" },
    { href: "/dashboard/doctor/opportunities", label: "Opportunities" },
    { href: "/dashboard/doctor/contacts", label: "Contacts" }
  ],
  facility: [
    { href: "/dashboard/facility", label: "Overview" },
    { href: "/dashboard/facility/profile", label: "Profile" },
    { href: "/dashboard/facility/offers", label: "Offers" },
    { href: "/dashboard/facility/doctors", label: "Find doctors" },
    { href: "/dashboard/facility/contacts", label: "Contacts" }
  ],
  admin: [
    { href: "/admin", label: "Overview" },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/profiles", label: "Profiles" },
    { href: "/admin/offers", label: "Offers" },
    { href: "/admin/contacts", label: "Contacts" }
  ]
};
