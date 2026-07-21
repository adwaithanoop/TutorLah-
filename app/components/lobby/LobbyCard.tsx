import { GroupPricing } from "@/lib/pricing/pricing";
import Avatar from "@/app/components/Avatar";
import JoinLobbyButton from "./JoinLobbyButton";
import CancelLobbyButton from "./CancelLobbyButton";

interface LobbyMember {
  id: string;
  name: string;
  avatarColor: string;
}

interface LobbyCardProps {
  id: string;
  title: string;
  moduleCode: string;
  creatorName: string;
  members: LobbyMember[];
  minParticipants: number;
  maxParticipants: number;
  budget: number;
  scheduledStart: string;
  scheduledEnd: string;
  deadline: string;
  isCreator: boolean;
  isMember: boolean;
}

// how many member avatars to show before collapsing to a count
const MAX_AVATARS = 5;

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

export default function LobbyCard({
  id,
  title,
  moduleCode,
  creatorName,
  members,
  minParticipants,
  maxParticipants,
  budget,
  scheduledStart,
  scheduledEnd,
  deadline,
  isCreator,
  isMember,
}: LobbyCardProps) {
  const memberCount = members.length;
  const isFull = memberCount >= maxParticipants;
  const perHead = new GroupPricing(budget, memberCount, 0).quote();

  return (
    <div className="rounded-2xl bg-white shadow-soft p-5">
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm font-semibold text-indigo-700">{moduleCode}</span>
        <span className="text-xs text-gray-400">{creatorName}</span>
      </div>
      <h3 className="mt-1 font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-600">{formatSchedule(scheduledStart, scheduledEnd)}</p>
      <p className="mt-1 text-xs text-gray-400">
        Fill by {new Date(deadline).toLocaleString("en-SG", DATE_OPTS)}
      </p>
      <div className="mt-2 flex items-center gap-2">
        <div className="flex -space-x-2">
          {members.slice(0, MAX_AVATARS).map((m) => (
            <Avatar
              key={m.id}
              name={m.name}
              colorClass={m.avatarColor}
              className="h-6 w-6 ring-2 ring-white"
              textClass="text-[10px]"
            />
          ))}
          {memberCount > MAX_AVATARS && (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-[10px] font-semibold text-gray-600 ring-2 ring-white">
              +{memberCount - MAX_AVATARS}
            </span>
          )}
        </div>
        <span className="truncate text-xs text-gray-500">{members.map((m) => m.name).join(", ")}</span>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="text-sm">
          <span className="font-semibold text-gray-900">${perHead}</span>
          <span className="ml-1 text-gray-500">/ student now</span>
          {!isFull && (
            <span className="ml-1 text-gray-400">
              (${new GroupPricing(budget, memberCount + 1, 0).quote()} if one more joins)
            </span>
          )}
          <span className="ml-3 text-xs text-gray-400">
            {memberCount} of {maxParticipants} (min {minParticipants})
          </span>
        </div>
        {isCreator ? (
          <CancelLobbyButton lobbyId={id} />
        ) : isMember ? (
          <span className="text-xs font-semibold text-emerald-600">Joined</span>
        ) : (
          <JoinLobbyButton lobbyId={id} disabled={isFull} />
        )}
      </div>
    </div>
  );
}
