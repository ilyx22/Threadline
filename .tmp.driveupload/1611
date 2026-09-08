"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Lightbulb, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/menu";
import { toast } from "@/components/ui/toast";
import {
  deletePatternAction,
  promotePatternToIdeaAction,
  setPatternStatusAction,
} from "@/lib/actions/intelligence";
import { PATTERN_STATUS_OPTIONS } from "@/lib/domain/enums";
import { SignalDialog, type SignalDefaults } from "../signal-actions";

export function SignalDetailActions({
  slug,
  patternId,
  status,
  canEdit,
  canCreateIdea,
  defaults,
}: {
  slug: string;
  patternId: string;
  status: string;
  canEdit: boolean;
  canCreateIdea: boolean;
  defaults: SignalDefaults;
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  const setStatus = (next: string) => {
    startTransition(async () => {
      const result = await setPatternStatusAction(slug, patternId, next);
      if (result.ok) {
        toast.success(result.message ?? "Signal updated.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const promote = () => {
    startTransition(async () => {
      const result = await promotePatternToIdeaAction(slug, patternId);
      if (result.ok) {
        toast.success("Idea created from this signal.");
        router.push(`/app/${slug}/create/ideas/${result.data.ideaId}`);
      } else {
        toast.error(result.error);
      }
    });
  };

  const remove = () => {
    if (!window.confirm("Delete this signal? Signals that produced ideas cannot be deleted.")) return;
    startTransition(async () => {
      const result = await deletePatternAction(slug, patternId);
      if (result.ok) {
        toast.success("Signal deleted.");
        router.push(`/app/${slug}/intelligence/signals`);
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2">
      {canCreateIdea ? (
        <Button variant="accent" icon={Lightbulb} loading={pending} onClick={promote}>
          Turn into an idea
        </Button>
      ) : null}

      {canEdit ? (
        <>
          <Button variant="secondary" icon={Pencil} onClick={() => setEditOpen(true)}>
            Edit
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" icon={MoreHorizontal}>
                <span className="sr-only">More actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Move to status</DropdownMenuLabel>
              {PATTERN_STATUS_OPTIONS.filter((o) => o.value !== status).map((option) => (
                <DropdownMenuItem key={option.value} onSelect={() => setStatus(option.value)}>
                  {option.label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem icon={Trash2} destructive onSelect={remove}>
                Delete signal
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {editOpen ? (
            <SignalDialog slug={slug} existing={defaults} open onOpenChange={setEditOpen} />
          ) : null}
        </>
      ) : null}
    </div>
  );
}
