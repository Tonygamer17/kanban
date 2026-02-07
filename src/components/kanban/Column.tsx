'use client';

import { Column, Task, Card } from '@/types/kanban';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import { useKanbanStore } from '@/lib/store';
import { Card as CardComponent } from './Card';
import { cn } from '@/lib/utils';

interface ColumnProps {
  column: Column;
  tasks: Task[];
  className?: string;
}

// Helper para converter Task para Card (compatibilidade)
function taskToCard(task: Task): Card {
  return {
    id: task.id,
    title: task.title,
    description: task.description || undefined,
    column_id: task.column_id,
    order_index: task.position,
    created_at: task.created_at,
    updated_at: task.created_at
  };
}

export function ColumnComponent({ column, tasks, className }: ColumnProps) {
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [newCardDescription, setNewCardDescription] = useState('');
  
  const { createCard, deleteColumn } = useKanbanStore();

  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  const handleAddCard = async () => {
    if (!newCardTitle.trim()) return;
    
    try {
      await createCard(column.id, newCardTitle, newCardDescription);
      setNewCardTitle('');
      setNewCardDescription('');
      setIsAddingCard(false);
    } catch (error) {
      console.error('Failed to add card:', error);
    }
  };

  const handleDeleteColumn = async () => {
    if (confirm(`Tem certeza que deseja excluir a coluna "${column.name}" e todos os seus cards?`)) {
      try {
        await deleteColumn(column.id);
      } catch (error) {
        console.error('Failed to delete column:', error);
      }
    }
  };

  const handleCancel = () => {
    setNewCardTitle('');
    setNewCardDescription('');
    setIsAddingCard(false);
  };

  const sortedTasks = tasks
    .filter(task => task.column_id === column.id)
    .sort((a, b) => a.position - b.position);

  const cards = sortedTasks.map(taskToCard);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col w-80 min-h-0 bg-gray-50 dark:bg-gray-900 rounded-lg",
        isOver && "bg-gray-100 dark:bg-gray-800",
        className
      )}
      role="region"
      aria-label={`${column.name} column with ${sortedTasks.length} tasks`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-3" role="region" aria-labelledby={`column-${column.id}-title`}>
        <h2 id={`column-${column.id}-title`} className="font-semibold text-gray-900 dark:text-gray-100">
          {column.name}
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400" aria-label={`${sortedTasks.length} tasks`}>
            {sortedTasks.length}
          </span>
          <button
            onClick={handleDeleteColumn}
            className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
            aria-label={`Delete column ${column.name}`}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 px-3 pb-3 overflow-y-auto">
        <SortableContext items={sortedTasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {cards.map((card) => (
              <CardComponent key={card.id} card={card} />
            ))}
          </div>
        </SortableContext>

        {/* Add Card Form */}
        {isAddingCard ? (
          <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="space-y-3">
              <input
                type="text"
                value={newCardTitle}
                onChange={(e) => setNewCardTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Título do card"
                autoFocus
              />
              <textarea
                value={newCardDescription}
                onChange={(e) => setNewCardDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Descrição (opcional)"
                rows={3}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddCard}
                  className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
                >
                  Adicionar
                </button>
                <button
                  onClick={handleCancel}
                  className="px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors text-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingCard(true)}
            className="mt-3 w-full p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400"
          >
            <Plus size={16} />
            Adicionar card
          </button>
        )}
      </div>
    </div>
  );
}
