"use client";

import { useState } from 'react';
import { TeamMember } from '@/types/kanban';
import { Users, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AssigneesProps {
  taskId: string;
  teamId: string;
  currentUserId: string;
  assignees?: string[];
  onUpdate?: (assignees: string[]) => void;
  className?: string;
}

// Mock team members for now - in real app would come from API
const mockTeamMembers: TeamMember[] = [
  { team_id: 'team-1', profile_id: 'user-1', role: 'owner', joined_at: '2024-01-01' },
  { team_id: 'team-1', profile_id: 'user-2', role: 'member', joined_at: '2024-01-01' },
];

export function AssigneesComponent({ 
  taskId: _taskId, 
  teamId: _teamId, 
  currentUserId: _currentUserId, 
  assignees: initialAssignees = [],
  onUpdate, 
  className 
}: AssigneesProps) {
  const [assignees, setAssignees] = useState<string[]>(initialAssignees);
  const [teamMembers] = useState<TeamMember[]>(mockTeamMembers);
  const [isOpen, setIsOpen] = useState(false);
  const [loading] = useState(false);

  const handleAssign = (memberId: string) => {
    if (assignees.includes(memberId)) return;

    const updatedAssignees = [...assignees, memberId];
    setAssignees(updatedAssignees);
    onUpdate?.(updatedAssignees);
  };

  const handleUnassign = (assigneeId: string) => {
    const updatedAssignees = assignees.filter(id => id !== assigneeId);
    setAssignees(updatedAssignees);
    onUpdate?.(updatedAssignees);
  };

  const getAvailableMembers = () => {
    return teamMembers.filter(m => !assignees.includes(m.profile_id));
  };

  const getUserInitials = (userId: string) => {
    return `U${userId.slice(-2)}`;
  };

  return (
    <div className={cn("relative", className)}>
      {/* Current assignees */}
      <div className="flex items-center gap-2 flex-wrap">
        {assignees.length > 0 ? (
          <>
            <div className="flex items-center gap-1 -space-x-2">
              {assignees.map((assigneeId) => (
                  <div
                    key={assigneeId}
                    className="relative group"
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium bg-blue-500 text-white border-2 border-white dark:border-gray-800"
                      title={`User ${assigneeId.slice(-4)}`}
                    >
                      {getUserInitials(assigneeId)}
                    </div>
                    
                    <button
                      onClick={() => handleUnassign(assigneeId)}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
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
            className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
          >
            <Plus size={12} />
            Assign
          </button>
        )}
        
        {assignees.length > 0 && (
          <button
            onClick={() => setIsOpen(true)}
            className="w-6 h-6 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full flex items-center justify-center transition-colors"
            title="Add assignee"
          >
            <Plus size={12} className="text-gray-600 dark:text-gray-300" />
          </button>
        )}
      </div>

      {/* Assignment dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-gray-500 dark:text-gray-400" />
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Assign to team member
                </h4>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={16} />
              </button>
            </div>
          </div>
          
          <div className="max-h-48 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                Loading team members...
              </div>
            ) : getAvailableMembers().length > 0 ? (
              getAvailableMembers().map((member) => (
                <button
                  key={member.profile_id}
                  onClick={() => {
                    handleAssign(member.profile_id);
                    setIsOpen(false);
                  }}
                  className="w-full p-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-blue-500 text-white">
                    {getUserInitials(member.profile_id)}
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      User {member.profile_id.slice(-4)}
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 capitalize">
                      {member.role}
                    </div>
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

      {/* Backdrop for dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
