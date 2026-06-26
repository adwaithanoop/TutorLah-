import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requestActionSchema } from "@/lib/validation/requests";
import {
  acceptBookingRequest,
  declineBookingRequest,
  cancelBookingRequest,
} from "@/lib/booking/requests";
import { notifyBookingResponse } from "@/lib/notifications/notifier";
import { formatSgtDateTime } from "@/lib/scheduling/display";

const UUID = /^[0-9a-f-]{36}$/i;

// One endpoint for the three single-party actions on a request. The caller's id is passed
// to the definer function, which enforces that only the tutor can accept or decline and
// only the student can cancel, so the action enum alone can never escalate.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: "Invalid request id" }, { status: 400 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = requestActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const admin = createAdminClient();
  try {
    if (parsed.data.action === "accept") {
      const booking = await acceptBookingRequest(admin, user.id, id);
      await notifyBookingResponse({
        studentId: booking.student_id,
        action: "accept",
        moduleCode: booking.module_code,
        when: formatSgtDateTime(booking.scheduled_start),
      });
      return NextResponse.json({ booking });
    }
    if (parsed.data.action === "decline") {
      const declined = await declineBookingRequest(admin, user.id, id);
      if (!parsed.data.silent) {
        await notifyBookingResponse({
          studentId: declined.student_id,
          action: "decline",
          moduleCode: declined.module_code,
          when: formatSgtDateTime(declined.scheduled_start),
        });
      }
      return NextResponse.json({ ok: true });
    }
    await cancelBookingRequest(admin, user.id, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Action failed";
    if (/insufficient/i.test(message)) {
      return NextResponse.json(
        { error: "The student does not have enough balance to confirm this session." },
        { status: 409 },
      );
    }
    // Two tutors confirming the same student's overlapping requests at once: the second
    // loses, either to the no-overlap guard or to a deadlock. Either way, say it plainly.
    if (/deadlock|just taken|overlap/i.test(message)) {
      return NextResponse.json({ error: "That slot was just taken, pick another." }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
