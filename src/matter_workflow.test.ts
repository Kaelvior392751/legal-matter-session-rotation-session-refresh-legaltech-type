import assert from "node:assert/strict";
import { buildFollowUp, intakeSchema } from "./matter_workflow.ts";

const intake = intakeSchema.parse({
  matterId: "matter-204",
  clientName: "Northstar Studio",
  deadline: "2026-11-01",
  documentName: "settlement-agreement.pdf"
});

assert.deepEqual(buildFollowUp(intake, "2026-11-01"), {
  matterId: "matter-204",
  action: "send-deadline-follow-up",
  documentName: "settlement-agreement.pdf"
});
console.log("deadline decision test passed");
