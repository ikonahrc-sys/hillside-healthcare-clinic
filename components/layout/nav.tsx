import Link from "next/link";

type NavItem = { label: string; href?: string };

const BASE_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "My Account", href: "/account" },
  { label: "Patients", href: "/patients" },
  { label: "Pharmacy", href: "/pharmacy" },
  { label: "Clinical Preparation" },
  { label: "Referrals", href: "/referrals" },
  { label: "Reports" },
  { label: "Users & Roles" },
  { label: "Settings" },
];

export function Nav({
  canManagePlacements,
  canManageClinicalPrep,
  canManageUsers,
}: {
  canManagePlacements: boolean;
  canManageClinicalPrep: boolean;
  canManageUsers: boolean;
}) {
  // "Placements" is inserted next to "Users & Roles" rather than added to
  // the static list unconditionally - it's real and permission-gated, the
  // rest are still placeholders for later phases. "Clinical Preparation"
  // and "Reports" are already in the static list as placeholders, so they
  // just need their href filled in once each feature exists.
  let items: NavItem[] = canManagePlacements
    ? [
        ...BASE_NAV_ITEMS.slice(0, -2),
        { label: "Placements", href: "/placements" },
        ...BASE_NAV_ITEMS.slice(-2),
      ]
    : BASE_NAV_ITEMS;

  if (canManageClinicalPrep) {
    items = items.map((item) =>
      item.label === "Clinical Preparation"
        ? { ...item, href: "/clinical-preparation" }
        : item,
    );
  }

  // The Pending Co-Signs report is gated by the same permission as
  // Placements - it's the same admin/coordinator oversight audience.
  if (canManagePlacements) {
    items = items.map((item) =>
      item.label === "Reports" ? { ...item, href: "/reports" } : item,
    );
  }

  if (canManageUsers) {
    items = items.map((item) =>
      item.label === "Users & Roles" ? { ...item, href: "/users" } : item,
    );
  }

  return (
    <nav className="flex flex-col gap-1 p-3">
      {items.map((item) =>
        item.href ? (
          <Link
            key={item.label}
            href={item.href}
            className="rounded px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            {item.label}
          </Link>
        ) : (
          <span
            key={item.label}
            className="flex items-center justify-between rounded px-3 py-2 text-sm text-slate-400"
            title="Not built yet - coming in a later phase"
          >
            {item.label}
            <span className="text-xs">planned</span>
          </span>
        ),
      )}
    </nav>
  );
}
