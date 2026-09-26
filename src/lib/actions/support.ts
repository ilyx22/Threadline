"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { audit } from "@/lib/auth/audit";
import { requireOrgAccess } from "@/lib/auth/guard";
import { raiseRequest } from "@/lib/support/requests";
import { guarded, okVoid, parseForm, type ActionResult } from "./shared";

const schema = z.object({ title: z.string().min(1, "Say what you need.").max(200), description: z.string().max(4000).optional(), blocking: z.string().optional() });

/** CX-07: any member of a client workspace can ask Threadline for help. */
export async function raiseSupportRequestAction(orgSlug: string, _prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "workspace.view");
    const input = parseForm(schema, formData);
    const issue = await raiseRequest(ctx.org.id, ctx.user.id, { title: input.title, description: input.description, blocking: input.blocking === "on" });
    await audit(ctx, { action: "support.raise", entityType: "support_issue", entityId: issue.id, summary: `Asked for help: ${issue.title}` });
    revalidatePath(`/app/${orgSlug}/help`);
    return okVoid("Sent. Threadline has it and will reply.");
  });
}
