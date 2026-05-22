/**
 * Sortable lead card on the kanban board.
 *
 * Uses @dnd-kit/sortable's useSortable so the card is both a drag handle
 * and a sortable item within its column's SortableContext. Cross-column
 * drops are handled by the board's DndContext (see LeadsKanbanBoard).
 */
"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, MapPin, MessageSquare } from "lucide-react";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import type { Lead } from "@/lib/queries";

function formatDate(iso?: string | null): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    });
  } catch {
    return null;
  }
}

export function LeadCard({ lead }: { lead: Lead }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: lead.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const followUp = formatDate(lead.application.received_date);

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className="cursor-grab touch-none p-3 active:cursor-grabbing">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/leads/${lead.id}`}
            onClick={(e) => e.stopPropagation()}
            className="font-mono text-xs text-primary hover:underline"
          >
            {lead.application.reference_number}
          </Link>
          {lead.note_count > 0 && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MessageSquare className="h-3 w-3" /> {lead.note_count}
            </span>
          )}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          {lead.application.council?.name}
        </div>
        {lead.application.site_address && (
          <div className="mt-2 flex items-start gap-1 text-xs">
            <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
            <span className="line-clamp-2">{lead.application.site_address}</span>
          </div>
        )}
        {followUp && (
          <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" /> received {followUp}
          </div>
        )}
      </Card>
    </div>
  );
}
