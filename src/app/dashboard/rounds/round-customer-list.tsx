"use client";

import { useTransition } from "react";
import { GripVertical } from "lucide-react";
import { reorderRoundCustomers } from "./actions";
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
import { useState } from "react";

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  address_line1: string;
  postcode: string;
  price: number;
  position_in_round: number | null;
}

interface RoundCustomerListProps {
  roundId: string;
  customers: Customer[];
}

export function RoundCustomerList({ roundId, customers: initial }: RoundCustomerListProps) {
  const [customers, setCustomers] = useState(initial);
  const [pending, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = customers.findIndex((c) => c.id === active.id);
    const newIndex = customers.findIndex((c) => c.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = arrayMove(customers, oldIndex, newIndex);
    setCustomers(reordered);
    startTransition(() => {
      reorderRoundCustomers(roundId, reordered.map((c) => c.id));
    });
  }

  const total = customers.reduce((sum, c) => sum + Number(c.price), 0);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-4 py-2 flex items-center text-xs font-medium text-gray-500 uppercase">
        <span className="w-8"></span>
        <span className="w-8 text-center">#</span>
        <span className="flex-1 ml-2">Name</span>
        <span className="w-40 hidden sm:block">Address</span>
        <span className="w-20 text-right">Price</span>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={customers.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          <div className="divide-y divide-gray-200">
            {customers.map((c, i) => (
              <SortableRow key={c.id} customer={c} index={i} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <div className="bg-gray-50 px-4 py-2 flex items-center justify-end border-t border-gray-200">
        <span className="text-sm font-medium text-gray-700 mr-4">Total</span>
        <span className="text-sm font-bold text-gray-900 w-20 text-right">£{total.toFixed(2)}</span>
      </div>
      {pending && (
        <div className="px-4 py-1 bg-blue-50 text-xs text-blue-600">Saving order...</div>
      )}
    </div>
  );
}

function SortableRow({ customer, index }: { customer: Customer; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: customer.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center px-4 py-2 ${isDragging ? "z-50 shadow-lg bg-white" : "hover:bg-gray-50"}`}
    >
      <button
        {...attributes}
        {...listeners}
        className="touch-none p-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing shrink-0 w-8"
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <span className="w-8 text-center text-sm text-gray-500">{index + 1}</span>
      <span className="flex-1 ml-2 text-sm text-gray-900">{customer.first_name} {customer.last_name}</span>
      <span className="w-40 hidden sm:block text-sm text-gray-500 truncate">{customer.address_line1}, {customer.postcode}</span>
      <span className="w-20 text-right text-sm text-gray-900">£{Number(customer.price).toFixed(2)}</span>
    </div>
  );
}
