/**
 * 5-column kanban board with @dnd-kit drag-and-drop.
 *
 * Columns: new · contacted · follow_up · won · lost. Each column wraps its
 * leads in a SortableContext keyed by the leads' UUIDs.
 *
 * Drag behaviour:
 * - Within a column: reorder; PATCH position = newIndex
 * - Across columns: move; PATCH stage = newStage (server appends to end)
 *
 * On error the kanban query refetches and the UI snaps back.
 */
"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { LeadCard } from "@/components/leads/LeadCard";
import { Card } from "@/components/ui/card";
import {
  useLeadsKanban,
  useUpdateLead,
  type Lead,
  type LeadStage,
} from "@/lib/queries";

const STAGE_LABELS: Record<LeadStage, string> = {
  new: "New",
  contacted: "Contacted",
  follow_up: "Follow up",
  won: "Won",
  lost: "Lost",
};

const STAGE_ORDER: LeadStage[] = [
  "new",
  "contacted",
  "follow_up",
  "won",
  "lost",
];

function DroppableColumn({
  stage,
  leads,
}: {
  stage: LeadStage;
  leads: Lead[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className="mb-2 flex items-center justify-between px-1">
        <h2 className="text-sm font-medium tracking-tight">
          {STAGE_LABELS[stage]}
        </h2>
        <span className="text-xs text-muted-foreground">{leads.length}</span>
      </div>
      <Card
        ref={setNodeRef}
        className={`flex min-h-[200px] flex-1 flex-col gap-2 bg-muted/30 p-2 transition-colors ${
          isOver ? "ring-2 ring-primary" : ""
        }`}
      >
        <SortableContext
          items={leads.map((l) => l.id)}
          strategy={verticalListSortingStrategy}
        >
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
          {leads.length === 0 && (
            <p className="px-1 py-4 text-center text-xs text-muted-foreground">
              Drop here
            </p>
          )}
        </SortableContext>
      </Card>
    </div>
  );
}

export function LeadsKanbanBoard() {
  const { data, isLoading, isError, error } = useLeadsKanban();
  const update = useUpdateLead();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const [activeId, setActiveId] = useState<string | null>(null);

  // Lookup tables — rebuilt whenever the kanban data changes.
  const { leadsById, stageByLead, leadsByStage } = useMemo(() => {
    const _leadsById: Record<string, Lead> = {};
    const _stageByLead: Record<string, LeadStage> = {};
    const _leadsByStage: Record<LeadStage, Lead[]> = {
      new: [],
      contacted: [],
      follow_up: [],
      won: [],
      lost: [],
    };
    for (const col of data?.columns ?? []) {
      for (const lead of col.leads) {
        _leadsById[lead.id] = lead;
        _stageByLead[lead.id] = col.stage;
      }
      _leadsByStage[col.stage] = col.leads;
    }
    return {
      leadsById: _leadsById,
      stageByLead: _stageByLead,
      leadsByStage: _leadsByStage,
    };
  }, [data]);

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;

    const activeLeadId = String(active.id);
    const overId = String(over.id);
    const fromStage = stageByLead[activeLeadId];
    if (!fromStage) return;

    // Did we drop on a column directly, or on a card?
    const isStageDrop = (STAGE_ORDER as string[]).includes(overId);
    const toStage = isStageDrop
      ? (overId as LeadStage)
      : stageByLead[overId];
    if (!toStage) return;

    if (fromStage === toStage) {
      // Reorder within the column.
      if (isStageDrop) return; // dropped on column header — no-op
      const col = leadsByStage[fromStage];
      const oldIdx = col.findIndex((l) => l.id === activeLeadId);
      const newIdx = col.findIndex((l) => l.id === overId);
      if (oldIdx === -1 || newIdx === -1 || oldIdx === newIdx) return;

      update.mutate(
        { id: activeLeadId, payload: { position: newIdx } },
        {
          onError: (err) => {
            toast.error(
              `Reorder failed: ${
                (err as { message?: string })?.message ?? "unknown error"
              }`,
            );
          },
        },
      );
    } else {
      // Cross-column move — bump stage; the server slots it at the end.
      update.mutate(
        { id: activeLeadId, payload: { stage: toStage } },
        {
          onSuccess: () =>
            toast.success(
              `Moved to ${STAGE_LABELS[toStage]}`,
            ),
          onError: (err) => {
            toast.error(
              `Move failed: ${
                (err as { message?: string })?.message ?? "unknown error"
              }`,
            );
          },
        },
      );
    }
  }

  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground">Loading kanban…</div>
    );
  }
  if (isError) {
    return (
      <div className="text-sm text-destructive">
        Failed to load leads: {(error as Error)?.message ?? "unknown error"}
      </div>
    );
  }

  const activeLead = activeId ? leadsById[activeId] : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGE_ORDER.map((stage) => (
          <DroppableColumn
            key={stage}
            stage={stage}
            leads={leadsByStage[stage]}
          />
        ))}
      </div>
      <DragOverlay>
        {activeLead ? <LeadCard lead={activeLead} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
