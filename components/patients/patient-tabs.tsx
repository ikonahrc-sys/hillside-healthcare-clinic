import Link from "next/link";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "timeline", label: "Timeline" },
  { key: "consultations", label: "Consultations" },
  { key: "prescriptions", label: "Prescriptions" },
  { key: "referrals", label: "Referrals" },
  { key: "rehabilitation", label: "Rehabilitation" },
] as const;

export function PatientTabs({
  patientId,
  active,
}: {
  patientId: string;
  active: string;
}) {
  return (
    <nav className="mb-4 flex gap-1 border-b border-slate-200">
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Link
            key={tab.key}
            href={`/patients/${patientId}?tab=${tab.key}`}
            className={
              isActive
                ? "border-b-2 border-slate-900 px-3 py-2 text-sm font-medium text-slate-900"
                : "border-b-2 border-transparent px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-700"
            }
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
