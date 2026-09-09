import { AssemblyStation, BranchingThread, Buyer, Crate, DistributionSorter, FeedbackPipe, Founder, InspectorStation, MemoryWeave, ScannerStation, StampMark } from "@/components/factory/primitives";

/** One illustration per chapter, drawn from the factory primitives. */
export function ChapterArt({ scene, className, large }: { scene: string; className?: string; large?: boolean }) {
  return <div className="tl-drawn contents">{art(scene, className, large)}</div>;
}

function art(scene: string, className?: string, large?: boolean) {
  switch (scene) {
    case "crates":
      return (
        <div className={className}>
          <div className="flex items-end gap-2">
            <Crate label="Expertise" tilt={-2} className="w-[48%]" />
            <Crate label="Stories" tilt={2} className="w-[48%]" />
          </div>
        </div>
      );
    case "founder":
      return <Founder className={className} holding={false} />;
    case "scanner":
      return <ScannerStation className={className} />;
    case "branching":
      return <BranchingThread branches={large ? 5 : 3} className={className} />;
    case "sorter":
      return <DistributionSorter className={className} />;
    case "memory":
      return <MemoryWeave stages={large ? ["Stranger", "Recognise", "Remember", "Trust", "Conversation"] : ["", "", ""]} className={className} />;
    case "attention":
      return (
        <div className={className}>
          <div className="flex items-end gap-2">
            <Buyer looking className="w-[48%]" />
            <Buyer looking={false} className="w-[48%] opacity-40" />
          </div>
        </div>
      );
    case "inspector":
      return <InspectorStation className={className} stamp="EXPECTED" />;
    case "pipe":
      return <FeedbackPipe className={className} width={320} />;
    case "stamp":
      return (
        <div className={className}>
          <StampMark label="No promises" reject />
        </div>
      );
    default:
      return <AssemblyStation className={className} />;
  }
}
