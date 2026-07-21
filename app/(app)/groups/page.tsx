import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/user";
import { getMode } from "@/app/(app)/mode";
import { listSubjects } from "@/lib/modules/catalog";
import CreateGroupForm from "@/app/components/group/CreateGroupForm";
import GroupSessionCard from "@/app/components/group/GroupSessionCard";
import GroupsRealtime from "@/app/components/group/GroupsRealtime";
import CreateLobbyForm from "@/app/components/lobby/CreateLobbyForm";
import LobbyCard from "@/app/components/lobby/LobbyCard";

export default async function GroupsPage() {
  const supabase = await createClient();
  // mode decides which half of the page renders; modules feed both create forms
  const [mode, user, modules, { data: sessions }] = await Promise.all([
    getMode(),
    getCurrentUser(supabase),
    listSubjects(),
    supabase
      .from("group_sessions")
      .select(
        "id, title, module_code, total_cost, max_participants, floor_per_student, scheduled_start, scheduled_end, tutor_id, tutor:profiles!group_sessions_tutor_id_fkey(full_name), group_enrolments(student_id)",
      )
      .eq("status", "open")
      .order("scheduled_start", { ascending: true }),
  ]);

  // lobbies are a student mode feature until tutors get their bidding view
  const { data: lobbies } =
    mode === "student"
      ? await supabase
          .from("group_lobbies")
          .select(
            "id, title, module_code, budget, min_participants, max_participants, scheduled_start, scheduled_end, deadline, creator_id, creator:profiles!group_lobbies_creator_id_fkey(full_name), lobby_members(student_id, student:profiles!lobby_members_student_id_fkey(full_name, avatar_color))",
          )
          .eq("status", "open")
          .order("scheduled_start", { ascending: true })
      : { data: null };

  const sessionCards =
    !sessions || sessions.length === 0 ? (
      <p className="text-sm text-gray-500">No open group sessions right now.</p>
    ) : (
      sessions.map((session) => {
        const enrolments = session.group_enrolments ?? [];
        const host = Array.isArray(session.tutor) ? session.tutor[0] : session.tutor;
        return (
          <GroupSessionCard
            key={session.id}
            id={session.id}
            title={session.title}
            moduleCode={session.module_code}
            hostName={host?.full_name ?? "Unknown host"}
            enrolled={enrolments.length}
            maxParticipants={session.max_participants}
            totalCost={session.total_cost}
            floorPerStudent={session.floor_per_student}
            scheduledStart={session.scheduled_start}
            scheduledEnd={session.scheduled_end}
            isHost={session.tutor_id === user!.id}
            alreadyEnrolled={enrolments.some((e) => e.student_id === user!.id)}
            canEnrol={mode === "student"}
          />
        );
      })
    );

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <GroupsRealtime />
      {mode === "tutor" ? (
        <>
          <h1 className="mb-1 text-3xl font-bold text-gray-900">Group sessions</h1>
          <p className="mb-6 text-sm text-gray-500">Host a session and students enrol as seats fill.</p>
          <div className="grid gap-8 lg:grid-cols-2">
            <section>
              <CreateGroupForm modules={modules} />
            </section>
            <section className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900">Open sessions</h2>
              {sessionCards}
            </section>
          </div>
        </>
      ) : (
        <>
          <h1 className="mb-1 text-3xl font-bold text-gray-900">Student lobbies</h1>
          <p className="mb-6 text-sm text-gray-500">
            Pool a budget with classmates. Tutors will bid to teach your group.
          </p>
          <div className="grid gap-8 lg:grid-cols-2">
            <section>
              <CreateLobbyForm modules={modules} />
            </section>
            <section className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900">Open lobbies</h2>
              {!lobbies || lobbies.length === 0 ? (
                <p className="text-sm text-gray-500">No open lobbies right now.</p>
              ) : (
                lobbies.map((lobby) => {
                  const members = lobby.lobby_members ?? [];
                  const creator = Array.isArray(lobby.creator) ? lobby.creator[0] : lobby.creator;
                  const memberList = members.map((m) => {
                    const profile = Array.isArray(m.student) ? m.student[0] : m.student;
                    return {
                      id: m.student_id,
                      name: profile?.full_name ?? "Student",
                      avatarColor: profile?.avatar_color ?? "bg-indigo-500",
                    };
                  });
                  return (
                    <LobbyCard
                      key={lobby.id}
                      id={lobby.id}
                      title={lobby.title}
                      moduleCode={lobby.module_code}
                      creatorName={creator?.full_name ?? "Unknown student"}
                      members={memberList}
                      minParticipants={lobby.min_participants}
                      maxParticipants={lobby.max_participants}
                      budget={lobby.budget}
                      scheduledStart={lobby.scheduled_start}
                      scheduledEnd={lobby.scheduled_end}
                      deadline={lobby.deadline}
                      isCreator={lobby.creator_id === user!.id}
                      isMember={members.some((m) => m.student_id === user!.id)}
                    />
                  );
                })
              )}
            </section>
          </div>

          <h1 className="mb-1 mt-12 text-3xl font-bold text-gray-900">Group sessions</h1>
          <p className="mb-6 text-sm text-gray-500">
            Hosted by tutors. Grab a seat and the price per student drops as more join.
          </p>
          <div className="grid gap-4 lg:grid-cols-2">{sessionCards}</div>
        </>
      )}
    </main>
  );
}
