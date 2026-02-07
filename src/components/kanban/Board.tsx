'use client';

import { BoardWithColumns, TeamMember } from '@/types/kanban';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { fetchBoardWithColumns, useKanbanStore } from '@/lib/store';
import { ColumnComponent } from './Column';
import { Plus, Edit } from 'lucide-react';
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

  const allTasks = useMemo(() => filteredBoard.columns.flatMap((column) => column.tasks || []), [filteredBoard.columns]);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over) return;

      const draggedTask = allTasks.find((task) => task.id === active.id);
      const targetTask = allTasks.find((task) => task.id === over.id);
      if (!draggedTask || !targetTask) return;

      if (draggedTask.column_id !== targetTask.column_id) {
        await moveTask(draggedTask.id, targetTask.column_id, 0);
      } else {
        const sourceColumnTasks = allTasks.filter((task) => task.column_id === draggedTask.column_id);
        const sourceIndex = sourceColumnTasks.findIndex((task) => task.id === draggedTask.id);
        const targetIndex = sourceColumnTasks.findIndex((task) => task.id === targetTask.id);

        if (sourceIndex !== targetIndex) {
          await moveTask(draggedTask.id, draggedTask.column_id, targetIndex);
        }
      }
    },
    [allTasks, moveTask]
  );

  return (
    <BoardErrorBoundary>
      <div className={cn('flex flex-col h-full bg-gray-100 dark:bg-gray-950', className)}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{board.name}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {filteredBoard.columns.length} colunas •{' '}
              {filteredBoard.columns.reduce((acc, col) => acc + (col.tasks?.length || 0), 0)} tasks
              {(filters.searchText || filters.assigneeId) && (
                <span className="ml-2 text-blue-600 dark:text-blue-400">(filtered)</span>
              )}
            </p>
          </div>

          <div className="flex gap-2">
            {!isAddingColumn && (
              <button
                onClick={() => setIsAddingColumn(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Plus size={16} />
                <span>Adicionar Coluna</span>
              </button>
            )}
            <button
              onClick={() => setIsEditingBoard(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Edit size={16} />
              <span>Editar Board</span>
            </button>
          </div>
        </div>

        <div className="px-6 pt-4">
          <BoardFilters filters={filters} teamMembers={teamMembers} onFiltersChange={setFilters} />
        </div>

        {isAddingColumn && (
          <div className="p-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex gap-3">
              <input
                type="text"
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nome da coluna"
                autoFocus
              />
              <button
                onClick={handleCreateColumn}
                disabled={isCreatingColumn}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isCreatingColumn ? 'Adicionando...' : 'Adicionar'}
              </button>
              <button
                onClick={() => {
                  setNewColumnName('');
                  setIsAddingColumn(false);
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 p-6 overflow-x-auto">
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <SortableContext items={filteredBoard.columns.map((col) => col.id)} strategy={horizontalListSortingStrategy}>
              <div className="flex gap-6 h-full">
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
                    className="w-80 h-fit p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex items-center justify-center gap-2"
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
