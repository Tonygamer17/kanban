'use client';

import { Task, TeamMember } from '@/types/kanban';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Edit2, Trash2 } from 'lucide-react';
import { useState } from 'react';
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
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description || '');

  const { updateTask, deleteTask } = useKanbanStore();

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleUpdate = async () => {
    try {
      await updateTask(task.id, editTitle, editDescription);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update task:', error);
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
          'bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700',
          className
        )}
      >
        <div className="space-y-3">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Título da task"
            autoFocus
          />
          <textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Descrição (opcional)"
            rows={3}
          />
          <div className="flex gap-2">
            <button
              onClick={handleUpdate}
              className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
            >
              Salvar
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
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow group',
        className
      )}
      role="article"
      aria-labelledby={`task-${task.id}-title`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h3 id={`task-${task.id}-title`} className="font-medium text-gray-900 dark:text-gray-100 mb-2">
            {task.title}
          </h3>
          {task.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-3">{task.description}</p>
          )}

          <div className="mb-3">
            <AssigneesComponent
              taskId={task.id}
              teamId={teamId}
              currentUserId={currentUserId}
              teamMembers={teamMembers}
              assignees={assignees}
              onUpdate={(updatedAssignees) => onAssigneesChange(task.id, updatedAssignees)}
            />
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            {...attributes}
            {...listeners}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Drag task"
          >
            <GripVertical size={16} />
          </button>

          <button
            onClick={() => setIsEditing(true)}
            className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            aria-label={`Edit task ${task.title}`}
          >
            <Edit2 size={14} />
          </button>

          <button
            onClick={handleDelete}
            className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            aria-label={`Delete task ${task.title}`}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
