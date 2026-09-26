"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, KeyRound, LogOut, ShieldCheck, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ActionButton, ActionForm, FormError, SubmitButton } from "@/components/forms/action-form";
import { beginMfaEnrolmentAction, confirmMfaEnrolmentAction, disableMfaAction, revokeOtherSessionsAction, revokeSessionAction } from "@/lib/actions/security";

const panel = "mt-8 rounded-xl border border-line bg-elevated p-6";

export function MfaPanel({ enabled, required, storageReady }: { enabled: boolean; required: boolean; storageReady: boolean }) {
  const router = useRouter();
  const [setup, setSetup] = React.useState<{ secret: string; uri: string } | null>(null);
  const [codes, setCodes] = React.useState<string[] | null>(null);
  const [startError, setStartError] = React.useState<string | null>(null);

  if (codes) {
    return (
      <section className={panel}>
        <h2 className="flex items-center gap-2 text-[16px] font-medium text-ink">
          <ShieldCheck className="size-4" aria-hidden /> Two-factor is on
        </h2>
        <p className="mt-2 text-[13px] text-muted">
          Save these recovery codes somewhere safe, such as a password manager. Each works once if you lose your phone. They are not shown again.
        </p>
        <ul className="mt-4 grid grid-cols-2 gap-2 font-mono text-[14px] text-ink">
          {codes.map((c) => (
            <li key={c} className="rounded-md border border-line px-3 py-2">
              {c}
            </li>
          ))}
        </ul>
        <Button
          className="mt-5"
          variant="primary"
          icon={Check}
          onClick={() => {
            setCodes(null);
            router.refresh();
          }}
        >
          I have saved them
        </Button>
      </section>
    );
  }

  if (enabled) {
    return (
      <section className={panel}>
        <h2 className="flex items-center gap-2 text-[16px] font-medium text-ink">
          <ShieldCheck className="size-4" aria-hidden /> Two-factor authentication is on
        </h2>
        <p className="mt-2 text-[13px] text-muted">
          Sign-in asks for a code from your authenticator app.{required ? " It is required for staff accounts." : ""}
        </p>
        {!required ? (
          <ActionForm action={disableMfaAction} onSuccess={() => router.refresh()} className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
            {({ error }) => (
              <>
                <div className="flex-1">
                  <FormError error={error} />
                  <Field label="Current code, to turn it off" htmlFor="off-code">
                    <Input id="off-code" name="code" autoComplete="one-time-code" />
                  </Field>
                </div>
                <SubmitButton variant="ghost" icon={ShieldOff}>
                  Turn off
                </SubmitButton>
              </>
            )}
          </ActionForm>
        ) : null}
      </section>
    );
  }

  return (
    <section className={panel}>
      <h2 className="flex items-center gap-2 text-[16px] font-medium text-ink">
        <KeyRound className="size-4" aria-hidden /> Two-factor authentication
      </h2>
      <p className="mt-2 text-[13px] text-muted">
        Adds a six-digit code from an authenticator app (1Password, Google Authenticator, Microsoft Authenticator and others) to every sign-in.
        {required ? " Required for staff accounts." : ""}
      </p>
      {!storageReady ? (
        <p className="mt-3 text-[13px] text-negative">This deployment has no credential encryption keys yet, so two-factor cannot be enrolled.</p>
      ) : null}
      {startError ? (
        <p role="alert" className="mt-3 text-[13px] text-negative">
          {startError}
        </p>
      ) : null}
      {!setup ? (
        <Button
          className="mt-4"
          variant="primary"
          icon={KeyRound}
          disabled={!storageReady}
          onClick={async () => {
            const r = await beginMfaEnrolmentAction();
            if (r.ok) setSetup(r.data);
            else setStartError(r.error);
          }}
        >
          Set up two-factor
        </Button>
      ) : (
        <div className="mt-4 space-y-4">
          <ol className="list-decimal space-y-2 pl-5 text-[13px] text-muted">
            <li>In your authenticator app, add an account and choose to enter a setup key.</li>
            <li>
              Enter this key (time-based, six digits):
              <code className="mt-1 block break-all rounded-md border border-line px-3 py-2 font-mono text-[14px] tracking-wider text-ink">
                {setup.secret.match(/.{1,4}/g)?.join(" ")}
              </code>
              <a href={setup.uri} className="mt-1 inline-block text-accent">
                Or open it in an authenticator on this device
              </a>
            </li>
            <li>Enter the code the app shows.</li>
          </ol>
          <ActionForm action={confirmMfaEnrolmentAction} onSuccess={(d) => setCodes(d.recoveryCodes)} className="flex flex-col gap-2 sm:flex-row sm:items-end">
            {({ error }) => (
              <>
                <div className="flex-1">
                  <FormError error={error} />
                  <Field label="Code from the app" htmlFor="mfa-code">
                    <Input id="mfa-code" name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} />
                  </Field>
                </div>
                <SubmitButton variant="primary" icon={Check}>
                  Turn on
                </SubmitButton>
              </>
            )}
          </ActionForm>
        </div>
      )}
    </section>
  );
}

type SessionView = { id: string; device: string | null; createdAt: string; lastSeenAt: string | null; verified: boolean };

function describeDevice(ua: string | null) {
  if (!ua) return "Unknown device";
  const browser = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Browser";
  const os = /iPhone|iPad/.test(ua) ? "iOS" : /Android/.test(ua) ? "Android" : /Mac OS X/.test(ua) ? "macOS" : /Windows/.test(ua) ? "Windows" : /Linux/.test(ua) ? "Linux" : "";
  return os ? `${browser} on ${os}` : browser;
}

export function SessionsPanel({ currentId, sessions }: { currentId: string; sessions: SessionView[] }) {
  const router = useRouter();
  const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "not recorded");
  return (
    <section className={panel}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[16px] font-medium text-ink">Where you are signed in</h2>
        {sessions.length > 1 ? (
          <ActionButton variant="ghost" icon={LogOut} action={() => revokeOtherSessionsAction()} confirm="Sign out everywhere except this browser?" onDone={() => router.refresh()}>
            Sign out other sessions
          </ActionButton>
        ) : null}
      </div>
      <ul className="mt-4 divide-y divide-line">
        {sessions.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div>
              <p className="text-[14px] text-ink">
                {describeDevice(s.device)}
                {s.id === currentId ? <span className="ml-2 text-[12px] text-accent">This browser</span> : null}
              </p>
              <p className="text-[12px] text-ghost">
                Signed in {fmt(s.createdAt)} · last active {fmt(s.lastSeenAt)}
                {s.verified ? " · two-factor verified" : ""}
              </p>
            </div>
            {s.id !== currentId ? (
              <ActionButton variant="ghost" action={() => revokeSessionAction(s.id)} onDone={() => router.refresh()}>
                End
              </ActionButton>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
