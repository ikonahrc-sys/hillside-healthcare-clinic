import Link from "next/link";
import { formatMrn } from "@/lib/services/patient-service";

type ScheduleAppointment = {
  id: string;
  scheduledAt: Date;
  notes: string | null;
  patient: { id: string; firstName: string; lastName: string; mrnNumber: number };
  staff: { fullName: string };
};

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    timeZone: "America/Belize",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    timeZone: "America/Belize",
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function AppointmentRow({
  appt,
  showDate,
}: {
  appt: ScheduleAppointment;
  showDate?: boolean;
}) {
  return (
    <li className="flex items-baseline justify-between border-t border-slate-100 py-2 first:border-t-0">
      <div>
        <Link
          href={`/patients/${appt.patient.id}`}
          className="text-sm font-medium text-slate-900 hover:underline"
        >
          {appt.patient.lastName}, {appt.patient.firstName}
        </Link>
        <span className="ml-2 text-xs text-slate-400">
          {formatMrn(appt.patient.mrnNumber)}
        </span>
        {appt.notes && (
          <p className="text-xs text-slate-500">{appt.notes}</p>
        )}
      </div>
      <span className="whitespace-nowrap text-xs font-medium text-slate-600">
        {showDate ? `${formatDate(appt.scheduledAt)}, ` : ""}
        {formatTime(appt.scheduledAt)}
      </span>
    </li>
  );
}

function ScheduleColumn({
  title,
  appointments,
  showDate,
}: {
  title: string;
  appointments: ScheduleAppointment[];
  showDate?: boolean;
}) {
  return (
    <div className="rounded border border-slate-200 bg-white p-4">
      <h2 className="mb-2 text-sm font-semibold text-slate-700">
        {title}{" "}
        <span className="font-normal text-slate-400">
          ({appointments.length})
        </span>
      </h2>
      {appointments.length === 0 ? (
        <p className="text-sm text-slate-400">Nothing scheduled.</p>
      ) : (
        <ul>
          {appointments.map((appt) => (
            <AppointmentRow key={appt.id} appt={appt} showDate={showDate} />
          ))}
        </ul>
      )}
    </div>
  );
}

export function DepartmentSchedule({
  today,
  tomorrow,
  upcoming,
}: {
  today: ScheduleAppointment[];
  tomorrow: ScheduleAppointment[];
  upcoming: ScheduleAppointment[];
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <ScheduleColumn title="Today" appointments={today} />
      <ScheduleColumn title="Tomorrow" appointments={tomorrow} />
      <ScheduleColumn title="Upcoming" appointments={upcoming} showDate />
    </div>
  );
}
