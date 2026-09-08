import Link from "next/link";
import { Table, TBody, TD, TH, THead, TR, CellTitle } from "@/components/ui/table";
import { Pill } from "@/components/ui/badge";
import { PLATFORM_META, metaOf } from "@/lib/domain/enums";
import { compactNumber, money } from "@/lib/utils/format";

/**
 * Content ranked by the commercial conversation it produced.
 *
 * Deliberately server-rendered and read-only: this is the report a founder
 * screenshots, not something they interact with.
 */
export function AttributionTable({
  slug,
  rows,
  currency,
}: {
  slug: string;
  rows: {
    contentItemId: string;
    title: string;
    platform: string;
    pillar: string | null;
    cta: string | null;
    views: number;
    inquiries: number;
    qualified: number;
    calls: number;
    won: number;
    valueMinor: number;
  }[];
  currency: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-line px-4 py-8 text-center text-[13px] text-faint">
        No inquiries have been linked to content yet. Link a record to the piece that produced it
        and this table fills itself in.
      </p>
    );
  }

  return (
    <Table>
      <THead>
        <TR>
          <TH>Content</TH>
          <TH align="right">Views</TH>
          <TH align="right">Inquiries</TH>
          <TH align="right">Qualified</TH>
          <TH align="right">Calls</TH>
          <TH align="right">Closed</TH>
        </TR>
      </THead>
      <TBody>
        {rows.map((row) => (
          <TR key={row.contentItemId} interactive>
            <TD>
              <Link href={`/app/${slug}/production/${row.contentItemId}`}>
                <CellTitle
                  secondary={
                    [row.pillar, metaOf(PLATFORM_META, row.platform).label]
                      .filter(Boolean)
                      .join(" · ") || undefined
                  }
                >
                  {row.title}
                </CellTitle>
              </Link>
              {row.cta ? (
                <Pill className="mt-1.5 max-w-full truncate">{row.cta}</Pill>
              ) : null}
            </TD>
            <TD align="right" className="tabular">
              {row.views > 0 ? compactNumber(row.views) : "—"}
            </TD>
            <TD align="right" className="tabular">
              {row.inquiries}
            </TD>
            <TD align="right" className="tabular">
              {row.qualified}
            </TD>
            <TD align="right" className="tabular font-medium text-accent">
              {row.calls}
            </TD>
            <TD align="right" className="tabular">
              {row.valueMinor > 0 ? money(row.valueMinor, currency, { compact: true }) : "—"}
            </TD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}
