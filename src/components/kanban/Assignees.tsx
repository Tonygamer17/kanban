"use client";

import { useEffect, useState } from 'react';
import { TeamMember } from '@/types/kanban';
import { Users, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

interface AssigneesProps {
  taskId: string;
  teamId: string;
  currentUserId: string | null;
  teamMembers: TeamMember[];
  assignees?: string[];
  onUpdate?: (assignees: string[]) => void;
  className?: string;
}

export function AssigneesComponent({
  taskId,
  teamId,
  currentUserId,
  teamMembers,
  assignees: initialAssignees = [],
  onUpdate,
  className,
}: AssigneesProps) {
  const [assignees, setAssignees] = useState<string[]>(initialAssignees);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setAssignees(initialAssignees);
  }, [initialAssignees]);

  const handleAssign = async (memberId: string) => {
    if (!currentUserId || assignees.includes(memberId)) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('task_assignees')
        .insert({
          task_id: taskId,
          assignee_id: memberId,
          assigned_by: currentUserId,
        });

      if (error) {
        throw error;
      }

      const updatedAssignees = [...assignees, memberId];
      setAssignees(updatedAssignees);
      onUpdate?.(updatedAssignees);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to assign member:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnassign = async (assigneeId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('task_assignees')
        .delete()
        .eq('task_id', taskId)
        .eq('assignee_id', assigneeId);

      if (error) {
        throw error;
      }

      const updatedAssignees = assignees.filter((id) => id !== assigneeId);
      setAssignees(updatedAssignees);
      onUpdate?.(updatedAssignees);
    } catch (error) {
      console.error('Failed to unassign member:', error);
    } finally {
      setLoading(false);
    }
  };

  const availableMembers = teamMembers.filter((member) => !assignees.includes(member.profile_id));

  const getUserInitials = (userId: string) => `U${userId.slice(-2).toUpperCase()}`;
  const getUserLabel = (userId: string) => `User ${userId.slice(-6)}`;

  return (
    <div className={cn('relative', className)}>
      <div className="flex items-center gap-2 flex-wrap">
        {assignees.length > 0 ? (
          <>
            <div className="flex items-center gap-1 -space-x-2">
              {assignees.map((assigneeId) => (
                <div key={assigneeId} className="relative group">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium bg-blue-500 text-white border-2 border-white dark:border-gray-800"
                    title={getUserLabel(assigneeId)}
                  >
                    {getUserInitials(assigneeId)}
                  </div>

                  <button
                    onClick={() => handleUnassign(assigneeId)}
                    disabled={loading}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center disabled:opacity-50"
                    title="Remove assignee"
                  >
                    <X size={8} />
                  </button>
                </div>
              ))}
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {assignees.length === 1 ? '1 assignee' : `${assignees.length} assignees`}
            </span>
          </>
        ) : (
          <button
            onClick={() => setIsOpen(true)}
            disabled={!currentUserId}
            className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:border-gray-400 dark:hover:border-gray-500 transition-colors disabled:opacity-50"
          >
            <Plus size={12} />
            Assign
          </button>
        )}

        {assignees.length > 0 && (
          <button
            onClick={() => setIsOpen(true)}
            disabled={!currentUserId || loading}
            className="w-6 h-6 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full flex items-center justify-center transition-colors disabled:opacity-50"
            title="Add assignee"
          >
            <Plus size={12} className="text-gray-600 dark:text-gray-300" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-gray-500 dark:text-gray-400" />
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Assign to team member ({teamId.slice(-6)})</h4>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">Saving...</div>
            ) : availableMembers.length > 0 ? (
              availableMembers.map((member) => (
                <button
                  key={member.profile_id}
                  onClick={() => handleAssign(member.profile_id)}
                  className="w-full p-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-blue-500 text-white">
                    {getUserInitials(member.profile_id)}
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-medium text-gray-900 dark:text-gray-100">{getUserLabel(member.profile_id)}</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 capitalize">{member.role}</div>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                No available team members to assign
              </div>
            )}
          </div>
        </div>
      )}

      {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}
    </div>
  );
}
