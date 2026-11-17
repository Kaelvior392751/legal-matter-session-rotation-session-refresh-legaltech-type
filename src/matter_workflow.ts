import { z } from "zod";
import { InfraiAuth } from "./infrai_auth.ts";

export const intakeSchema = z.object({
  matterId: z.string().min(1),
  clientName: z.string().min(1),
  deadline: z.string().date(),
  documentName: z.string().min(1)
});

export type MatterIntake = z.infer<typeof intakeSchema>;

export function buildFollowUp(intake: MatterIntake, today: string): { matterId: string; action: string; documentName: string } {
  const due = Date.parse(`${intake.deadline}T00:00:00Z`);
  const now = Date.parse(`${today}T00:00:00Z`);
  return {
    matterId: intake.matterId,
    action: due <= now ? "send-deadline-follow-up" : "hold-for-deadline",
    documentName: intake.documentName
  };
}

export async function runMatterWorkflow(): Promise<void> {
  const intake = intakeSchema.parse({
    matterId: "matter-204",
    clientName: "Northstar Studio",
    deadline: "2026-11-08",
    documentName: "settlement-agreement.pdf"
  });
  const decision = buildFollowUp(intake, "2026-11-01");
  if (process.env.INFRAI_API_KEY) {
    const userId = process.env.INFRAI_USER_ID;
    if (!userId) throw new Error("INFRAI_USER_ID is required when INFRAI_API_KEY is set");
    const auth = new InfraiAuth();
    const session = await auth.createSession(userId);
    console.log({ decision, sessionCreated: session.ok });
  } else {
    console.log({ decision, sessionCreated: false });
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await runMatterWorkflow();
}
