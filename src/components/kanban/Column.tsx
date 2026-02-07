'use client';

import { Column, Task, TeamMember } from '@/types/kanban';
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
  teamId: string;
  currentUserId: string | null;
  teamMembers: TeamMember[];
  taskAssigneesMap: Record<string, string[]>;
  onTaskAssigneesChange: (taskId: string, assignees: string[]) => void;
  onTaskCreated: (columnId: string) => Promise<void>;
  onColumnDeleted: (columnId: string) => Promise<void>;
  className?: string;
}

export function ColumnComponent({
  column,
  tasks,
  teamId,
  currentUserId,
  teamMembers,
  taskAssigneesMap,
  onTaskAssigneesChange,
  onTaskCreated,
  onColumnDeleted,
  className,
}: ColumnProps) {
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isDeletingColumn, setIsDeletingColumn] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');

  const { createTask, deleteColumn } = useKanbanStore();

  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  const handleCreateTask = async () => {
    const trimmedTitle = newTaskTitle.trim();
    if (!trimmedTitle || isCreatingTask) return;

    setIsCreatingTask(true);
    try {
      await createTask(column.id, trimmedTitle, newTaskDescription.trim());
      await onTaskCreated(column.id);
      setNewTaskTitle('');
      setNewTaskDescription('');
      setIsAddingTask(false);
    } catch (error) {
      console.error('Failed to add task:', error);
    } finally {
      setIsCreatingTask(false);
    }
  };

  const handleDeleteColumn = async () => {
    if (isDeletingColumn) return;

    if (confirm(`Tem certeza que deseja excluir a coluna "${column.name}" e todas as suas tasks?`)) {
      setIsDeletingColumn(true);
      try {
        await deleteColumn(column.id);
        await onColumnDeleted(column.id);
      } catch (error) {
        console.error('Failed to delete column:', error);
      } finally {
        setIsDeletingColumn(false);
      }
    }
  };

  const handleCancel = () => {
    setNewTaskTitle('');
    setNewTaskDescription('');
    setIsAddingTask(false);
  };

  const sortedTasks = tasks
    .filter((task) => task.column_id === column.id)
    .sort((a, b) => a.position - b.position);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col w-80 min-h-0 bg-gray-50 dark:bg-gray-900 rounded-lg',
        isOver && 'bg-gray-100 dark:bg-gray-800',
        className
      )}
      role="region"
      aria-label={`${column.name} column with ${sortedTasks.length} tasks`}
    >
      <div className="flex items-center justify-between p-4 pb-3" role="region" aria-labelledby={`column-${column.id}-title`}>
        <h2 id={`column-${column.id}-title`} className="font-semibold text-gray-900 dark:text-gray-100">
          {column.name}
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400" aria-label={`${sortedTasks.length} tasks`}>
            {sortedTasks.length}
          </span>
          <button
            onClick={() => setIsAddingTask(true)}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            aria-label={`Create task in ${column.name}`}
            title="Criar task"
          >
            <Plus size={12} />
            <span>Nova task</span>
          </button>
          <button
            onClick={handleDeleteColumn}
            disabled={isDeletingColumn}
            className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            aria-label={`Delete column ${column.name}`}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 px-3 pb-3 overflow-y-auto">
        <SortableContext items={sortedTasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {sortedTasks.map((task) => (
              <CardComponent
                key={task.id}
                task={task}
                teamId={teamId}
                currentUserId={currentUserId}
                teamMembers={teamMembers}
                assignees={taskAssigneesMap[task.id] || []}
                onAssigneesChange={onTaskAssigneesChange}
              />
            ))}
          </div>
        </SortableContext>

        {isAddingTask ? (
          <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="space-y-3">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Título da task"
                autoFocus
              />
              <textarea
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Descrição (opcional)"
                rows={3}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCreateTask}
                  disabled={isCreatingTask}
                  className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isCreatingTask ? 'Salvando...' : 'Adicionar'}
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
            onClick={() => setIsAddingTask(true)}
            className="mt-3 w-full p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors flex items-center justify-center gap-2 text-sm text-blue-700 dark:text-blue-300"
          >
            <Plus size={16} />
            Criar nova task
          </button>
        )}
      </div>
    </div>
  );
}
