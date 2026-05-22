/**
 * /leads — drag-and-drop kanban board. Client-only because the dnd-kit
 * interaction layer needs to mount in the browser.
 */
import { LeadsKanbanBoard } from "@/components/leads/LeadsKanbanBoard";

export default function LeadsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
        <p className="text-sm text-muted-foreground">
          Drag cards between columns to move a lead through the pipeline.
          Drop in the same column to reorder.
        </p>
      </div>
      <LeadsKanbanBoard />
    </div>
  );
}
