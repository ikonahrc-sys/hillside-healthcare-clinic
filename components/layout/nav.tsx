import Link from "next/link";

type NavItem = { label: string; href?: string };

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Patients", href: "/patients" },
  { label: "Medical" },
  { label: "Pharmacy" },
  { label: "Rehabilitation" },
  { label: "Home Nursing" },
  { label: "Appointments" },
  { label: "Clinical Preparation" },
  { label: "Referrals", href: "/referrals" },
  { label: "Reports" },
  { label: "Users & Roles" },
  { label: "Settings" },
];

export function Nav() {
  return (
    <nav className="flex flex-col gap-1 p-3">
      {NAV_ITEMS.map((item) =>
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
