import { Buyer, Founder } from "@/components/factory/primitives";
import { Branch, Cut, InspectionMark, Lens, MemoryThread, ReturnThread, Route, Spool } from "@/components/factory/schematic";
import { Stamp } from "@/components/public/primitives";

/** One illustration per chapter, drawn from the schematic set (v2). */
export function ChapterArt({ scene, className, large }: { scene: string; className?: string; large?: boolean }) {
  return <div className="tl-drawn contents">{art(scene, className, large)}</div>;
}

function art(scene: string, className?: string, large?: boolean) {
  switch (scene) {
    case "crates":
      return (
        <div className={className}>
          <div className="flex items-end justify-center gap-4">
            <Spool accent className={large ? "w-24" : "w-10"} />
            <Spool className={large ? "w-24" : "w-10"} />
          </div>
        </div>
      );
    case "founder":
      return <Founder className={className} holding={false} />;
    case "scanner":
      return <Lens className={className} />;
    case "branching":
      return <Branch branches={large ? 5 : 3} className={className} />;
    case "sorter":
      return <Route className={className} />;
    case "memory":
      return <MemoryThread stages={large ? ["Stranger", "Recognise", "Remember", "Trust", "Conversation"] : ["", "", ""]} className={className} />;
    case "attention":
      return (
        <div className={className}>
          <div className="flex items-end justify-center gap-3">
            <Buyer looking className="w-[40%]" />
            <Buyer looking={false} className="w-[40%] opacity-40" />
          </div>
        </div>
      );
    case "inspector":
      return <InspectionMark className={className} />;
    case "pipe":
      return <ReturnThread className={className} width={320} />;
    case "stamp":
      return (
        <div className={className}>
          <Stamp tone="reject">No promises</Stamp>
        </div>
      );
    default:
      return <Cut className={className} />;
  }
}
