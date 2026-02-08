'use client';

import { Column, Task, TeamMember } from '@/types/kanban';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, MoreHorizontal, Trash2, Inbox } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
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
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const menuRef = useRef<HTMLDivElement | null>(null);

  const { createTask, deleteColumn } = useKanbanStore();

  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setIsColumnMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, []);

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
        'flex flex-col w-80 min-h-0 rounded-2xl border border-gray-200 bg-white/90 shadow-sm dark:border-gray-800 dark:bg-gray-900/80',
        isOver && 'border-blue-300 bg-blue-50/50 dark:border-blue-700 dark:bg-blue-900/10',
        className
      )}
      role="region"
      aria-label={`${column.name} column with ${sortedTasks.length} tasks`}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800" role="region" aria-labelledby={`column-${column.id}-title`}>
        <div className="flex items-center gap-2">
          <h2 id={`column-${column.id}-title`} className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {column.name}
          </h2>
          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-200/70 text-gray-700 dark:bg-gray-800 dark:text-gray-300" aria-label={`${sortedTasks.length} tasks`}>
            {sortedTasks.length}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsAddingTask(true)}
            className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-gray-300 bg-white text-gray-600 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:text-blue-300 dark:hover:border-blue-600 dark:hover:bg-blue-900/20"
            aria-label={`Create task in ${column.name}`}
            title="Criar task"
          >
            <Plus size={14} />
          </button>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsColumnMenuOpen((prev) => !prev)}
              className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-gray-300 bg-white text-gray-600 hover:text-gray-900 hover:border-gray-400 transition-all duration-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
              aria-label={`Open actions for ${column.name}`}
            >
              <MoreHorizontal size={14} />
            </button>
            {isColumnMenuOpen && (
              <div className="absolute right-0 top-9 z-20 min-w-40 rounded-lg border border-gray-200 bg-white p-1.5 shadow-lg dark:border-gray-700 dark:bg-gray-900">
                <button
                  onClick={() => {
                    setIsColumnMenuOpen(false);
                    handleDeleteColumn();
                  }}
                  disabled={isDeletingColumn}
                  className="w-full inline-flex items-center gap-2 rounded-md px-2.5 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Trash2 size={14} />
                  Excluir coluna
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 px-3.5 py-3 overflow-y-auto">
        <SortableContext items={sortedTasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2.5">
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

            {sortedTasks.length === 0 && !isAddingTask && (
              <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-950/40 px-4 py-7 text-center">
                <Inbox size={18} className="mx-auto mb-2 text-gray-400" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Nenhuma task ainda</p>
                <button
                  onClick={() => setIsAddingTask(true)}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 hover:border-blue-400 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:text-blue-300 transition-all duration-200"
                >
                  <Plus size={12} />
                  Criar primeira task
                </button>
              </div>
            )}
          </div>
        </SortableContext>

        {isAddingTask ? (
          <div className="mt-3 p-3.5 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-200">
            <div className="space-y-3">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Titulo da task"
                autoFocus
              />
              <textarea
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Descricao (opcional)"
                rows={3}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCreateTask}
                  disabled={isCreatingTask}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isCreatingTask ? 'Salvando...' : 'Adicionar'}
                </button>
                <button
                  onClick={handleCancel}
                  className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingTask(true)}
            className="mt-3 w-full p-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:border-blue-400 hover:bg-blue-50/70 dark:hover:border-blue-500 dark:hover:bg-blue-900/20 transition-all duration-200 flex items-center justify-center gap-2 text-sm font-medium"
          >
            <Plus size={16} />
            Criar nova task
          </button>
        )}
      </div>
    </div>
  );
}
