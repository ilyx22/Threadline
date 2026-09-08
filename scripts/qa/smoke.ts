import { prisma } from "../../src/lib/db/client";
import { actAs, anonymous, attempt, cleanupSessions, fd, expiredSession, malformedCookie } from "./context";
import { createIdeaAction, deleteIdeaAction, updateIdeaAction } from "../../src/lib/actions/ideas";

async function main() {
  // 1. Real founder creates an idea through the real server action.
  await actAs("alex@northbeamadvisory.com");
  const created = await attempt(() =>
    createIdeaAction("northbeam", null, fd({ title: "QA smoke idea", platform: "linkedin", format: "short_form" })),
  );
  console.log("founder create:", created.outcome, created.outcome === "ok" ? JSON.stringify(created.value) : (created as any).message);
  if (created.outcome !== "ok") throw new Error("harness cannot drive actions");
  const id = (created.value as any).data.id as string;
  const row = await prisma.idea.findUnique({ where: { id }, include: { org: { select: { slug: true } } } });
  console.log("persisted:", row?.title, "org:", row?.org.slug);

  // 2. Anonymous cannot touch it.
  anonymous();
  console.log("anon update:", JSON.stringify(await attempt(() => updateIdeaAction("northbeam", id, null, fd({ title: "hacked" })))));

  // 3. Expired and malformed sessions.
  await expiredSession("alex@northbeamadvisory.com");
  console.log("expired update:", JSON.stringify(await attempt(() => updateIdeaAction("northbeam", id, null, fd({ title: "hacked" })))));
  malformedCookie();
  console.log("malformed update:", JSON.stringify(await attempt(() => updateIdeaAction("northbeam", id, null, fd({ title: "hacked" })))));

  // 4. Other tenant's admin, via their own slug with A's id (IDOR) and via A's slug (route substitution).
  await actAs("priya@lumenpath.example.com");
  console.log("priya IDOR:", JSON.stringify(await attempt(() => updateIdeaAction("lumenpath", id, null, fd({ title: "hacked" })))));
  console.log("priya route-sub:", JSON.stringify(await attempt(() => updateIdeaAction("northbeam", id, null, fd({ title: "hacked" })))));
  const after = await prisma.idea.findUnique({ where: { id } });
  console.log("title unchanged:", after?.title === "QA smoke idea");

  // cleanup
  await actAs("alex@northbeamadvisory.com");
  await deleteIdeaAction("northbeam", id);
  await cleanupSessions();
}
main().catch((e) => { console.error("SMOKE FAILED", e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
