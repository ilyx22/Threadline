"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ActionButton } from "@/components/forms/action-form";
import { toast } from "@/components/ui/toast";
import { earlyWinAction, signOffInstallationAction } from "@/lib/actions/installation-signoff";

type Props = {
  slug: string;
  complete: boolean;
  signedOffAt: string | null;
  earlyWin: { definition: string | null; achievedOn: string | null; evidence: string | null };
  canSignOff: boolean;
  isStaff: boolean;
};

/** ENG-03: installation sign-off (gated on a complete checklist) and the early win. */
export function InstallSignoff({ slug, complete, signedOffAt, earlyWin, canSignOff, isStaff }: Props) {
  const router = useRouter();
  const [text, setText] = React.useState("");
  const [pending, start] = React.useTransition();
  const save = (input: { definition?: string; evidence?: string }) =>
    start(async () => {
      const r = await earlyWinAction(slug, input);
      if (r.ok) {
        setText("");
        router.refresh();
      } else toast.error(r.error);
    });
  return (
    <section className="space-y-4 rounded-md border border-line p-4 text-[12.5px]" aria-labelledby="signoff-h">
      <h2 id="signoff-h" className="text-[13px] font-medium text-ink">
        Sign-off and early win
      </h2>
      <div>
        {signedOffAt ? (
          <p className="text-ink">Installation signed off on {new Date(signedOffAt).toLocaleDateString("en-GB")}.</p>
        ) : canSignOff ? (
          <div className="space-y-1">
            <p className="text-muted">{complete ? "Every step is complete. Sign off when you are satisfied." : "Sign-off opens once every step above is complete."}</p>
            <ActionButton size="sm" disabled={!complete} action={() => signOffInstallationAction(slug)} onDone={() => router.refresh()} confirm="Sign off installation?">
              Sign off installation
            </ActionButton>
          </div>
        ) : (
          <p className="text-muted">Not signed off yet.</p>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-muted">Early win: {earlyWin.definition ?? "not agreed yet"}</p>
        {earlyWin.achievedOn ? <p className="text-ink">Happened on {earlyWin.achievedOn}: {earlyWin.evidence}</p> : null}
        {isStaff && !earlyWin.achievedOn ? (
          <div className="flex flex-wrap gap-2">
            <Input value={text} onChange={(e) => setText(e.target.value)} placeholder={earlyWin.definition ? "What shows it happened" : "The concrete early win, agreed at kickoff"} aria-label="Early win" className="max-w-md" />
            <Button size="sm" disabled={pending || !text.trim()} onClick={() => save(earlyWin.definition ? { evidence: text } : { definition: text })}>
              {earlyWin.definition ? "Record it happened" : "Agree it"}
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
