"use client";

import { useState, useTransition } from "react";
import { CheckCircle, SkipForward, Phone, MessageSquare, Navigation, Undo2, GripVertical } from "lucide-react";
import { markCustomerStatus, addNoteToCustomer, reorderRunCustomers } from "./actions";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface CustomerData {
  customer_id: string;
  position: number;
  price: number;
  status: string;
  notes: string | null;
  completed_at: string | null;
  customers: {
    id: string;
    first_name: string;
    last_name: string;
    address_line1: string;
    address_line2: string | null;
    city: string;
    postcode: string;
    phone: string | null;
    latitude: number | null;
    longitude: number | null;
    notes: string | null;
  } | null;
}

interface RoundViewClientProps {
  run: { id: string; name: string; scheduled_date: string; status: string };
  customers: CustomerData[];
  googleMapsApiKey: string;
}

export function RoundViewClient({ run, customers }: RoundViewClientProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [pending, startTransition] = useTransition();

  const pendingCustomers = customers.filter((c) => c.status === "pending");
  const completedCustomers = customers.filter((c) => c.status === "completed");
  const skippedCustomers = customers.filter((c) => c.status === "skipped" || c.status === "cancelled");
  const nextCustomer = pendingCustomers[0];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = pendingCustomers.findIndex((c) => c.customer_id === active.id);
    const newIndex = pendingCustomers.findIndex((c) => c.customer_id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = arrayMove(pendingCustomers, oldIndex, newIndex);
    startTransition(() => {
      reorderRunCustomers(run.id, reordered.map((c) => c.customer_id));
    });
  }

  function handleComplete(customerId: string) {
    startTransition(() => { markCustomerStatus(run.id, customerId, "completed"); });
  }

  function handleSkip(customerId: string) {
    startTransition(() => { markCustomerStatus(run.id, customerId, "skipped"); });
  }

  function handleUndo(customerId: string) {
    startTransition(() => { markCustomerStatus(run.id, customerId, "pending"); });
  }

  function handleSaveNote(customerId: string) {
    startTransition(() => { addNoteToCustomer(run.id, customerId, noteText); });
    setExpandedId(null);
    setNoteText("");
  }

  function toggleExpand(customerId: string) {
    if (expandedId === customerId) {
      setExpandedId(null);
    } else {
      setExpandedId(customerId);
      const item = customers.find((c) => c.customer_id === customerId);
      setNoteText(item?.notes ?? "");
    }
  }

  function openNavigation(address: string, postcode: string) {
    const query = encodeURIComponent(`${address}, ${postcode}`);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${query}`, "_blank");
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{run.name}</h2>
          <p className="text-sm text-gray-500">
            {completedCustomers.length}/{customers.length} done
            {skippedCustomers.length > 0 && ` · ${skippedCustomers.length} skipped`}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-700">
            £{customers.reduce((sum, c) => sum + (c.status === "completed" ? Number(c.price) : 0), 0).toFixed(2)} earned
          </p>
          <p className="text-xs text-gray-500">
            of £{customers.reduce((sum, c) => sum + Number(c.price), 0).toFixed(2)} total
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-green-500 h-2 rounded-full transition-all"
          style={{ width: `${((customers.length - pendingCustomers.length) / customers.length) * 100}%` }}
        />
      </div>

      {/* Next Customer Card */}
      {nextCustomer && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-xs font-medium text-blue-600 uppercase mb-1">Next House</p>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-lg font-bold text-gray-900">
                {nextCustomer.customers?.first_name} {nextCustomer.customers?.last_name}
              </p>
              <p className="text-sm text-gray-700">
                {nextCustomer.customers?.address_line1}
                {nextCustomer.customers?.address_line2 && `, ${nextCustomer.customers.address_line2}`}
              </p>
              <p className="text-sm text-gray-500">
                {nextCustomer.customers?.city}, {nextCustomer.customers?.postcode}
              </p>
              {nextCustomer.customers?.notes && (
                <p className="text-xs text-amber-700 mt-1 bg-amber-50 px-2 py-1 rounded inline-block">
                  📝 {nextCustomer.customers.notes}
                </p>
              )}
            </div>
            <p className="text-lg font-bold text-gray-900">£{Number(nextCustomer.price).toFixed(2)}</p>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => handleComplete(nextCustomer.customer_id)}
              disabled={pending}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              Done
            </button>
            <button
              onClick={() => handleSkip(nextCustomer.customer_id)}
              disabled={pending}
              className="inline-flex items-center justify-center gap-2 bg-gray-200 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-300 disabled:opacity-50"
            >
              <SkipForward className="w-4 h-4" />
              Skip
            </button>
            {nextCustomer.customers?.phone && (
              <a
                href={`tel:${nextCustomer.customers.phone}`}
                className="inline-flex items-center justify-center bg-gray-200 text-gray-700 px-3 py-2.5 rounded-lg hover:bg-gray-300"
              >
                <Phone className="w-4 h-4" />
              </a>
            )}
            <button
              onClick={() => openNavigation(nextCustomer.customers?.address_line1 ?? "", nextCustomer.customers?.postcode ?? "")}
              className="inline-flex items-center justify-center bg-blue-100 text-blue-700 px-3 py-2.5 rounded-lg hover:bg-blue-200"
              title="Navigate"
            >
              <Navigation className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* All done */}
      {pendingCustomers.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <p className="text-lg font-bold text-green-800">Round Complete!</p>
          <p className="text-sm text-green-600">
            {completedCustomers.length} completed · £{customers.reduce((sum, c) => sum + (c.status === "completed" ? Number(c.price) : 0), 0).toFixed(2)} earned
          </p>
        </div>
      )}

      {/* Pending Customers (drag to reorder) */}
      {pendingCustomers.length > 1 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">
            Up Next ({pendingCustomers.length} remaining)
          </h3>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={pendingCustomers.map((c) => c.customer_id)} strategy={verticalListSortingStrategy}>
              <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
                {pendingCustomers.map((c, idx) => (
                  <SortableCustomerRow
                    key={c.customer_id}
                    item={c}
                    isFirst={idx === 0}
                    expanded={expandedId === c.customer_id}
                    pending={pending}
                    noteText={expandedId === c.customer_id ? noteText : ""}
                    onToggleExpand={() => toggleExpand(c.customer_id)}
                    onComplete={() => handleComplete(c.customer_id)}
                    onSkip={() => handleSkip(c.customer_id)}
                    onNoteChange={setNoteText}
                    onNoteSave={() => handleSaveNote(c.customer_id)}
                    onNavigate={() => openNavigation(c.customers?.address_line1 ?? "", c.customers?.postcode ?? "")}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {/* Completed / Skipped (with undo) */}
      {(completedCustomers.length > 0 || skippedCustomers.length > 0) && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">
            Done ({completedCustomers.length + skippedCustomers.length})
          </h3>
          <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
            {[...completedCustomers, ...skippedCustomers].map((c) => {
              const cust = c.customers;
              const isExpanded = expandedId === c.customer_id;
              return (
                <div key={c.customer_id} className={`${c.status === "completed" ? "bg-green-50/50" : "bg-gray-50"}`}>
                  <div
                    className="p-3 flex items-center justify-between cursor-pointer"
                    onClick={() => toggleExpand(c.customer_id)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`text-xs font-bold w-5 text-center shrink-0 ${
                        c.status === "completed" ? "text-green-600" : "text-gray-400"
                      }`}>
                        {c.status === "completed" ? "✓" : "—"}
                      </span>
                      <div className="min-w-0">
                        <p className={`text-sm font-medium truncate line-through ${
                          c.status === "completed" ? "text-green-800" : "text-gray-500"
                        }`}>
                          {cust?.first_name} {cust?.last_name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {cust?.address_line1}, {cust?.postcode}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <span className="text-sm text-gray-500">£{Number(c.price).toFixed(2)}</span>
                      <button
                        onClick={() => openNavigation(cust?.address_line1 ?? "", cust?.postcode ?? "")}
                        className="p-1.5 text-blue-500 hover:bg-blue-100 rounded"
                        title="Navigate"
                      >
                        <Navigation className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleUndo(c.customer_id)}
                        disabled={pending}
                        className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded disabled:opacity-50"
                        title="Undo"
                      >
                        <Undo2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {/* Expanded: call + note */}
                  {isExpanded && (
                    <div className="px-3 pb-3 pt-0 ml-8 space-y-2">
                      {cust?.phone && (
                        <a
                          href={`tel:${cust.phone}`}
                          className="inline-flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-100"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          Call {cust.phone}
                        </a>
                      )}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          placeholder="Add a note..."
                          className="flex-1 text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <button
                          onClick={() => handleSaveNote(c.customer_id)}
                          disabled={pending}
                          className="text-sm font-medium text-blue-600 hover:text-blue-700 px-3 disabled:opacity-50"
                        >
                          Save
                        </button>
                      </div>
                      {c.notes && (
                        <p className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded inline-block">
                          📝 {c.notes}
                        </p>
                      )}
                    </div>
                  )}
                  {c.notes && !isExpanded && (
                    <p className="px-3 pb-2 ml-8 text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded inline-block">
                      📝 {c.notes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Sortable row for pending customers ---
interface SortableCustomerRowProps {
  item: CustomerData;
  isFirst: boolean;
  expanded: boolean;
  pending: boolean;
  noteText: string;
  onToggleExpand: () => void;
  onComplete: () => void;
  onSkip: () => void;
  onNoteChange: (text: string) => void;
  onNoteSave: () => void;
  onNavigate: () => void;
}

function SortableCustomerRow({
  item,
  isFirst,
  expanded,
  pending,
  noteText,
  onToggleExpand,
  onComplete,
  onSkip,
  onNoteChange,
  onNoteSave,
  onNavigate,
}: SortableCustomerRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.customer_id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const cust = item.customers;

  return (
    <div ref={setNodeRef} style={style} className={`${isFirst ? "bg-blue-50/50" : ""} ${isDragging ? "z-50 shadow-lg bg-white" : ""}`}>
      <div className="p-3 flex items-center justify-between">
        {/* Left: drag handle + name (tappable to expand) */}
        <div className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer" onClick={onToggleExpand}>
          <button
            {...attributes}
            {...listeners}
            className="touch-none p-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {cust?.first_name} {cust?.last_name}
              {item.notes && <MessageSquare className="w-3 h-3 inline ml-1 text-amber-500" />}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {cust?.address_line1}, {cust?.postcode}
            </p>
          </div>
        </div>
        {/* Right: always-visible actions */}
        <div className="flex items-center gap-1 shrink-0 ml-2">
          <button
            onClick={onNavigate}
            className="p-1.5 text-blue-500 hover:bg-blue-100 rounded"
            title="Navigate"
          >
            <Navigation className="w-4 h-4" />
          </button>
          {!isFirst && (
            <>
              <button
                onClick={onSkip}
                disabled={pending}
                className="p-1.5 text-gray-400 hover:bg-gray-100 rounded disabled:opacity-50"
                title="Skip"
              >
                <SkipForward className="w-4 h-4" />
              </button>
              <button
                onClick={onComplete}
                disabled={pending}
                className="p-1.5 text-green-600 hover:bg-green-100 rounded disabled:opacity-50"
                title="Done"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
      {/* Expanded: call + note */}
      {expanded && (
        <div className="px-3 pb-3 pt-0 ml-8 space-y-2">
          {cust?.phone && (
            <a
              href={`tel:${cust.phone}`}
              className="inline-flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-100"
            >
              <Phone className="w-3.5 h-3.5" />
              Call {cust.phone}
            </a>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={noteText}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder="Add a note..."
              className="flex-1 text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={onNoteSave}
              disabled={pending}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 px-3 disabled:opacity-50"
            >
              Save
            </button>
          </div>
          {item.notes && (
            <p className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded inline-block">
              📝 {item.notes}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
