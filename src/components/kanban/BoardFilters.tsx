"use client";

import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TeamMember } from '@/types/kanban';

export interface FilterOptions {
  searchText: string;
  assigneeId: string | null;
}

interface BoardFiltersProps {
  filters: FilterOptions;
  teamMembers: TeamMember[];
  onFiltersChange: (filters: FilterOptions) => void;
  className?: string;
}

export function BoardFilters({ filters, teamMembers, onFiltersChange, className }: BoardFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilters = (updates: Partial<FilterOptions>) => {
    onFiltersChange({
      ...filters,
      ...updates,
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      searchText: '',
      assigneeId: null,
    });
    setIsExpanded(false);
  };

  const hasActiveFilters = Boolean(filters.searchText || filters.assigneeId);
  const uniqueMembers = teamMembers.filter(
    (member, index, self) => index === self.findIndex((m) => m.profile_id === member.profile_id)
  );

  return (
    <div className={cn('mb-4', className)}>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={filters.searchText}
            onChange={(e) => updateFilters({ searchText: e.target.value })}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            'p-2 border border-gray-300 dark:border-gray-600 rounded-lg transition-colors',
            isExpanded || hasActiveFilters
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-700'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
          )}
          title="More filters"
        >
          <Filter size={16} />
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            title="Clear all filters"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="mt-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Assigned to</label>
              <select
                value={filters.assigneeId || ''}
                onChange={(e) => updateFilters({ assigneeId: e.target.value || null })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All assignees</option>
                <option value="unassigned">Unassigned</option>
                {uniqueMembers.map((member) => (
                  <option key={member.profile_id} value={member.profile_id}>
                    User {member.profile_id.slice(-6)} ({member.role})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {hasActiveFilters && !isExpanded && (
        <div className="mt-2 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
          <span>Active filters:</span>
          {filters.searchText && (
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-md">
              Text: &quot;{filters.searchText}&quot;
            </span>
          )}
          {filters.assigneeId && (
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-md">
              Assignee: {filters.assigneeId === 'unassigned' ? 'Unassigned' : filters.assigneeId.slice(-6)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
