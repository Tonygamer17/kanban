'use client';

import { BoardWithColumns, TeamMember } from '@/types/kanban';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { fetchBoardWithColumns, useKanbanStore } from '@/lib/store';
import { ColumnComponent } from './Column';
import { Plus, Edit, ChevronRight, LayoutGrid, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BoardErrorBoundary } from '@/components/ErrorBoundary';
import { BoardFilters, FilterOptions } from './BoardFilters';
import { EditBoardModal } from './EditBoardModal';
import { teamMembersApi, supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthContextProvider';

interface BoardProps {
  board: BoardWithColumns;
  className?: string;
}

export function BoardComponent({ board, className }: BoardProps) {
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [isCreatingColumn, setIsCreatingColumn] = useState(false);
  const [isEditingBoard, setIsEditingBoard] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    searchText: '',
    assigneeId: null,
  });
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [taskAssigneesMap, setTaskAssigneesMap] = useState<Record<string, string[]>>({});

  const { createColumn, moveTask, updateBoard, deleteBoard, setCurrentBoard } = useKanbanStore();
  const { user } = useAuth();
  const currentUserId = user?.id || null;

  const refreshBoardState = useCallback(async () => {
    const updatedBoard = await fetchBoardWithColumns(board.id);
    if (!updatedBoard) return;

    const columnsById = new Map<string, (typeof updatedBoard.columns)[number]>();
    for (const column of updatedBoard.columns) {
      const tasksById = new Map<string, (typeof column.tasks)[number]>();
      for (const task of column.tasks || []) {
        if (task?.id && !tasksById.has(task.id)) {
          tasksById.set(task.id, task);
        }
      }

      if (column?.id && !columnsById.has(column.id)) {
        columnsById.set(column.id, {
          ...column,
          tasks: Array.from(tasksById.values()),
        });
      }
    }

    setCurrentBoard({
      ...updatedBoard,
      columns: Array.from(columnsById.values()),
    });
  }, [board.id, setCurrentBoard]);

  useEffect(() => {
    let isMounted = true;

    const loadMembers = async () => {
      try {
        const members = await teamMembersApi.getByTeamId(board.team_id);
        if (isMounted) {
          setTeamMembers(members);
        }
      } catch (error) {
        console.error('Failed to load team members:', error);
      }
    };

    loadMembers();

    return () => {
      isMounted = false;
    };
  }, [board.team_id]);

  useEffect(() => {
    let isMounted = true;

    const loadTaskAssignees = async () => {
      const taskIds = board.columns.flatMap((column) => (column.tasks || []).map((task) => task.id));
      if (taskIds.length === 0) {
        if (isMounted) {
          setTaskAssigneesMap({});
        }
        return;
      }

      try {
        const { data, error } = await supabase
          .from('task_assignees')
          .select('task_id, assignee_id')
          .in('task_id', taskIds);

        if (error) {
          throw error;
        }

        const nextMap: Record<string, string[]> = {};
        for (const taskId of taskIds) {
          nextMap[taskId] = [];
        }

        for (const row of data || []) {
          if (!nextMap[row.task_id]) {
            nextMap[row.task_id] = [];
          }
          nextMap[row.task_id].push(row.assignee_id);
        }

        if (isMounted) {
          setTaskAssigneesMap(nextMap);
        }
      } catch (error) {
        console.error('Failed to load task assignees:', error);
      }
    };

    loadTaskAssignees();

    return () => {
      isMounted = false;
    };
  }, [board.columns]);

  const handleTaskAssigneesChange = useCallback((taskId: string, assignees: string[]) => {
    setTaskAssigneesMap((prev) => ({
      ...prev,
      [taskId]: assignees,
    }));
  }, []);

  const filteredBoard = useMemo(() => {
    const search = filters.searchText.trim().toLowerCase();

    return {
      ...board,
      columns: board.columns.map((column) => ({
        ...column,
        tasks: (column.tasks || []).filter((task) => {
          if (search) {
            const titleMatch = task.title.toLowerCase().includes(search);
            const descriptionMatch = task.description?.toLowerCase().includes(search);
            if (!titleMatch && !descriptionMatch) {
              return false;
            }
          }

          if (filters.assigneeId) {
            const assignees = taskAssigneesMap[task.id] || [];
            if (filters.assigneeId === 'unassigned') {
              return assignees.length === 0;
            }
            return assignees.includes(filters.assigneeId);
          }

          return true;
        }),
      })),
    };
  }, [board, filters, taskAssigneesMap]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleCreateColumn = async () => {
    const trimmedName = newColumnName.trim();
    if (!trimmedName || isCreatingColumn) return;

    setIsCreatingColumn(true);
    try {
      await createColumn(board.id, trimmedName);
      await refreshBoardState();
      setNewColumnName('');
      setIsAddingColumn(false);
    } catch (error) {
      console.error('Failed to create column:', error);
    } finally {
      setIsCreatingColumn(false);
    }
  };

  const allTasks = useMemo(() => board.columns.flatMap((column) => column.tasks || []), [board.columns]);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeId = String(active.id);
      const overId = String(over.id);

      if (activeId === overId) {
        return;
      }

      const draggedTask = allTasks.find((task) => task.id === active.id);
      if (!draggedTask) return;

      const targetTask = allTasks.find((task) => task.id === overId);
      const targetColumnId = targetTask
        ? targetTask.column_id
        : board.columns.find((column) => column.id === overId)?.id;

      if (!targetColumnId) {
        return;
      }

      const targetColumnTasks = allTasks
        .filter((task) => task.column_id === targetColumnId)
        .sort((a, b) => a.position - b.position);

      const sourceColumnTasks = allTasks
        .filter((task) => task.column_id === draggedTask.column_id)
        .sort((a, b) => a.position - b.position);

      const sourceIndex = sourceColumnTasks.findIndex((task) => task.id === draggedTask.id);
      const targetIndex = targetTask
        ? targetColumnTasks.findIndex((task) => task.id === targetTask.id)
        : targetColumnTasks.length;

      if (sourceIndex < 0 || targetIndex < 0) {
        return;
      }

      if (draggedTask.column_id === targetColumnId && sourceIndex === targetIndex) {
        return;
      }

      await moveTask(draggedTask.id, targetColumnId, targetIndex);
      await refreshBoardState();
    },
    [allTasks, board.columns, moveTask, refreshBoardState]
  );

  return (
    <BoardErrorBoundary>
      <div className={cn('flex flex-col h-full bg-gray-100 dark:bg-gray-950', className)}>
        <div className="px-8 pt-6 pb-5 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">
                <span>Workspace</span>
                <ChevronRight size={12} />
                <span className="text-gray-700 dark:text-gray-200">{board.name}</span>
              </div>
              <h1 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">{board.name}</h1>
              <div className="mt-3 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-200/80 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  <LayoutGrid size={12} />
                  {filteredBoard.columns.length} colunas
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-200/80 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  <CheckSquare size={12} />
                  {filteredBoard.columns.reduce((acc, col) => acc + (col.tasks?.length || 0), 0)} tasks
                </span>
                {(filters.searchText || filters.assigneeId) && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    filtrado
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2.5">
              {!isAddingColumn && (
                <button
                  onClick={() => setIsAddingColumn(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-colors shadow-sm"
                >
                  <Plus size={16} />
                  <span>Adicionar Coluna</span>
                </button>
              )}
              <button
                onClick={() => setIsEditingBoard(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                <Edit size={16} />
                <span>Editar Board</span>
              </button>
            </div>
          </div>
        </div>

        <div className="px-8 pt-4">
          <BoardFilters filters={filters} teamMembers={teamMembers} onFiltersChange={setFilters} />
        </div>

        {isAddingColumn && (
          <div className="px-8 py-5 border-b border-gray-200 dark:border-gray-800">
            <div className="flex gap-3">
              <input
                type="text"
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nome da coluna"
                autoFocus
              />
              <button
                onClick={handleCreateColumn}
                disabled={isCreatingColumn}
                className="px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isCreatingColumn ? 'Adicionando...' : 'Adicionar'}
              </button>
              <button
                onClick={() => {
                  setNewColumnName('');
                  setIsAddingColumn(false);
                }}
                className="px-4 py-2.5 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 px-8 py-6 overflow-x-auto">
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <SortableContext items={filteredBoard.columns.map((col) => col.id)} strategy={horizontalListSortingStrategy}>
              <div className="flex gap-7 h-full items-start">
                {filteredBoard.columns.map((column) => (
                  <ColumnComponent
                    key={column.id}
                    column={column}
                    tasks={column.tasks || []}
                    teamId={board.team_id}
                    currentUserId={currentUserId}
                    teamMembers={teamMembers}
                    taskAssigneesMap={taskAssigneesMap}
                    onTaskAssigneesChange={handleTaskAssigneesChange}
                    onTaskCreated={refreshBoardState}
                    onColumnDeleted={refreshBoardState}
                  />
                ))}

                {!isAddingColumn && board.columns.length > 0 && (
                  <button
                    onClick={() => setIsAddingColumn(true)}
                    className="w-80 h-fit p-4 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-gray-500 dark:text-gray-400 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-300 transition-colors flex items-center justify-center gap-2 bg-white/70 dark:bg-gray-900/50"
                  >
                    <Plus size={20} />
                    <span>Adicionar outra coluna</span>
                  </button>
                )}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        <EditBoardModal
          board={board}
          isOpen={isEditingBoard}
          onClose={() => setIsEditingBoard(false)}
          onSave={async (boardId, newName) => {
            await updateBoard(boardId, newName);
            await refreshBoardState();
            setIsEditingBoard(false);
          }}
          onDelete={async (boardId) => {
            await deleteBoard(boardId);
            setIsEditingBoard(false);
          }}
        />
      </div>
    </BoardErrorBoundary>
  );
}
