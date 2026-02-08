'use client';

import { Task, TeamMember } from '@/types/kanban';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Edit2, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useKanbanStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { AssigneesComponent } from './Assignees';

interface CardProps {
  task: Task;
  teamId: string;
  currentUserId: string | null;
  teamMembers: TeamMember[];
  assignees: string[];
  onAssigneesChange: (taskId: string, assignees: string[]) => void;
  className?: string;
}

type TaskStatus = 'todo' | 'in_progress' | 'done';

const normalizeStatus = (value?: string | null): TaskStatus => {
  if (value === 'in_progress' || value === 'done') {
    return value;
  }
  return 'todo';
};

export function Card({
  task,
  teamId,
  currentUserId,
  teamMembers,
  assignees,
  onAssigneesChange,
  className,
}: CardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description || '');
  const [statusValue, setStatusValue] = useState<TaskStatus>(normalizeStatus(task.status));

  const { updateTask, deleteTask } = useKanbanStore();

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.55 : 1,
  };

  useEffect(() => {
    setStatusValue(normalizeStatus(task.status));
  }, [task.status]);

  const statusLabelMap: Record<string, string> = {
    todo: 'A fazer',
    in_progress: 'Em andamento',
    done: 'Concluído',
  };

  const statusStyles: Record<string, string> = {
    todo: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700',
    in_progress: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/60',
    done: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/60',
  };

  const updatedLabel = useMemo(() => {
    const baseDate = task.updated_at || task.created_at;
    if (!baseDate) return '';

    const diffMs = Date.now() - new Date(baseDate).getTime();
    if (Number.isNaN(diffMs) || diffMs < 60_000) {
      return 'Atualizado agora';
    }

    const minutes = Math.floor(diffMs / 60_000);
    if (minutes < 60) {
      return `Atualizado ha ${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `Atualizado ha ${hours} h`;
    }

    const days = Math.floor(hours / 24);
    return `Atualizado ha ${days} d`;
  }, [task.updated_at, task.created_at]);

  const handleUpdate = async () => {
    try {
      await updateTask(task.id, {
        title: editTitle,
        description: editDescription,
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleStatusChange = async (value: TaskStatus) => {
    if (!value) return;
    console.log('[task-status] update:start', { taskId: task.id, newStatus: value });

    setStatusValue(value);
    setIsUpdatingStatus(true);

    try {
      await updateTask(task.id, {
        status: value,
        updated_at: new Date().toISOString(),
      });
      console.log('[task-status] update:success', { taskId: task.id, newStatus: value });
    } catch (error) {
      console.error('[task-status] update:error', {
        taskId: task.id,
        newStatus: value,
        error,
      });
      setStatusValue(normalizeStatus(task.status));
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Tem certeza que deseja excluir esta task?')) {
      try {
        await deleteTask(task.id);
      } catch (error) {
        console.error('Failed to delete task:', error);
      }
    }
  };

  const handleCancel = () => {
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          'bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-200/80 dark:border-gray-700/80',
          className
        )}
      >
        <div className="space-y-3">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Título da task"
            autoFocus
          />
          <textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Descrição (opcional)"
            rows={3}
          />
          <div className="flex gap-2">
            <button
              onClick={handleUpdate}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors text-sm"
            >
              Salvar
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
    );
  }

  return (
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          'bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-200/80 dark:border-gray-700/80 cursor-pointer hover:-translate-y-0.5 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 group',
          className
        )}
        role="article"
        aria-labelledby={`task-${task.id}-title`}
      >
      <div className="flex items-start justify-between gap-3.5">
        <div className="flex-1">
          <div className="mb-2.5 flex items-center gap-2">
            {statusLabelMap[statusValue] ? (
              <span className={cn('inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-[10px] font-semibold leading-none', statusStyles[statusValue] || statusStyles.todo)}>
                <span className="text-[9px] leading-none">●</span>
                {statusLabelMap[statusValue]}
              </span>
            ) : null}
          </div>

          <h3 id={`task-${task.id}-title`} className="text-sm leading-5 font-bold text-gray-900 dark:text-gray-100 mb-2.5">
            {task.title}
          </h3>
          {task.description && (
            <p className="text-xs leading-5 text-gray-500 dark:text-gray-400/90 line-clamp-2 mb-4">{task.description}</p>
          )}

          <div className="mb-4.5">
            <AssigneesComponent
              taskId={task.id}
              teamId={teamId}
              currentUserId={currentUserId}
              teamMembers={teamMembers}
              assignees={assignees}
              onUpdate={(updatedAssignees) => onAssigneesChange(task.id, updatedAssignees)}
            />
          </div>

          <div className="pt-1.5 flex items-center justify-between gap-3">
            <select
              value={statusValue}
              onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
              disabled={isUpdatingStatus}
              className="h-7 rounded-full border border-gray-200/90 bg-white/90 px-2.5 text-[10px] font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800/90 dark:text-gray-300 dark:hover:bg-gray-800 disabled:opacity-60"
            >
              <option value="todo">A fazer</option>
              <option value="in_progress">Em andamento</option>
              <option value="done">Concluído</option>
            </select>

            {updatedLabel ? <span className="text-[10px] text-gray-400/90">{updatedLabel}</span> : null}
          </div>

        </div>

        <div className="flex items-center gap-1 opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 pointer-events-none group-hover:pointer-events-auto transition-all duration-200">
          <button
            {...attributes}
            {...listeners}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-800 transition-colors"
            aria-label="Drag task"
          >
            <GripVertical size={16} />
          </button>

          <button
            onClick={() => setIsEditing(true)}
            className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-900/20 transition-colors"
            aria-label={`Edit task ${task.title}`}
          >
            <Edit2 size={14} />
          </button>

          <button
            onClick={handleDelete}
            className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-colors"
            aria-label={`Delete task ${task.title}`}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
