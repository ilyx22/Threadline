import * as React from "react";
import Image from "next/image";

/**
 * One object from the flat set (docs/design/nano-banana-reference/generated/objects,
 * served from public/marketing/objects). Labels never live inside the artwork;
 * the object is decorative and the words sit beside it in HTML.
 */
export type ObjName = "spool" | "press" | "peg" | "sheet-written" | "screen-video" | "document-stack" | "sheet-tick" | "crate" | "folder" | "paper-stack" | "lamp" | "bench" | "magnifier" | "ledger" | "microphone" | "camera" | "stamp";

/** `big` uses the 1024-square renders in objects-big (spool, magnifier, press, peg, ledger, stamp only). */
export function Obj({ name, size = 160, delay = 0, big = false }: { name: ObjName; size?: number; delay?: number; big?: boolean }) {
  return (
    <span className="v9-obj" style={{ ["--s" as string]: `${size}px`, ["--d" as string]: `${delay}ms` }} aria-hidden="true">
      <Image src={`/marketing/${big ? "objects-big" : "objects"}/${name}.png`} alt="" fill sizes={`${size}px`} loading="eager" />
    </span>
  );
}
