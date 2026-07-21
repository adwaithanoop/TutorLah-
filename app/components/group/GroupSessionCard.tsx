import { GroupPricing } from "@/lib/pricing/pricing";
import EnrolButton from "./EnrolButton";
import CancelGroupButton from "./CancelGroupButton";

interface GroupSessionCardProps {
  id: string;
  title: string;
  moduleCode: string;
  hostName: string;
  enrolled: number;
  maxParticipants: number;
  totalCost: number;
  floorPerStudent: number;
  scheduledStart: string;
  scheduledEnd: string;
  isHost: boolean;
  alreadyEnrolled: boolean;
  canEnrol: boolean;
}

const DATE_OPTS: Intl.DateTimeFormatOptions = {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
};

// session time range
function formatSchedule(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  return `${s.toLocaleString("en-SG", DATE_OPTS)} to ${e.toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit" })}`;
}

export default function GroupSessionCard({
  id,
  title,
  moduleCode,
  hostName,
  enrolled,
  maxParticipants,
  totalCost,
  floorPerStudent,
  scheduledStart,
  scheduledEnd,
  isHost,
  alreadyEnrolled,
  canEnrol,
}: GroupSessionCardProps) {
  const seatsLeft = maxParticipants - enrolled;
  const isFull = seatsLeft <= 0;
  const nextPrice = new GroupPricing(totalCost, enrolled + 1, floorPerStudent).quote();

  return (
    <div className="rounded-2xl bg-white shadow-soft p-5">
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm font-semibold text-indigo-700">{moduleCode}</span>
        <span className="text-xs text-gray-400">{hostName}</span>
      </div>
      <h3 className="mt-1 font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-600">{formatSchedule(scheduledStart, scheduledEnd)}</p>
      <div className="mt-3 flex items-center justify-between">
        <div className="text-sm">
          <span className="font-semibold text-gray-900">${nextPrice}</span>
          <span className="ml-1 text-gray-500">/ student next</span>
          <span className="ml-3 text-xs text-gray-400">
            {seatsLeft > 0 ? `${seatsLeft} seat${seatsLeft === 1 ? "" : "s"} left` : "Full"}
          </span>
        </div>
        {isHost ? (
          <CancelGroupButton groupId={id} />
        ) : alreadyEnrolled ? (
          <span className="text-xs font-semibold text-emerald-600">Enrolled</span>
        ) : canEnrol ? (
          <EnrolButton groupId={id} disabled={isFull} />
        ) : null}
      </div>
    </div>
  );
}
