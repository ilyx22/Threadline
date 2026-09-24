import * as React from "react";
import Image from "next/image";

/**
 * One object from the flat set (docs/design/nano-banana-reference/generated/objects,
 * served from public/marketing/objects). Labels never live inside the artwork;
 * the object is decorative and the words sit beside it in HTML.
 */
export type ObjName = "spool" | "press" | "peg" | "sheet-written" | "screen-video" | "document-stack" | "sheet-tick" | "crate" | "folder" | "paper-stack" | "lamp" | "bench" | "magnifier" | "ledger" | "microphone" | "camera" | "stamp";

export function Obj({ name, size = 160, delay = 0 }: { name: ObjName; size?: number; delay?: number }) {
  return (
    <span className="v9-obj" style={{ ["--s" as string]: `${size}px`, ["--d" as string]: `${delay}ms` }} aria-hidden="true">
      <Image src={`/marketing/objects/${name}.png`} alt="" fill sizes={`${size}px`} loading="eager" />
    </span>
  );
}
