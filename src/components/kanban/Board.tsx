'use client';

import { BoardWithColumns } from '@/types/kanban';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { useState, useMemo, useCallback } from 'react';
import { useKanbanStore } from '@/lib/store';
import { ColumnComponent } from './Column';
import { Plus, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BoardErrorBoundary } from '@/components/ErrorBoundary';
import { BoardFilters, FilterOptions } from './BoardFilters';
import { EditBoardModal } from './EditBoardModal';

interface BoardProps {
  board: BoardWithColumns;
  className?: string;
}

export function BoardComponent({ board, className }: BoardProps) {
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [isEditingBoard, setIsEditingBoard] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    searchText: '',
    assigneeId: null
  });
  
  const { createColumn, moveCard, updateBoard } = useKanbanStore();

  // Filter columns and tasks based on filters - memoized for performance
  const filteredBoard = useMemo(() => {
    if (!filters.searchText) {
      return board;
    }

    const searchLower = filters.searchText.toLowerCase();
    
    return {
      ...board,
      columns: board.columns.map(column => ({
        ...column,
        tasks: (column.tasks || []).filter(task => {
          // Text search filter
          if (filters.searchText) {
            const titleMatch = task.title.toLowerCase().includes(searchLower);
            const descriptionMatch = task.description?.toLowerCase().includes(searchLower);
            
            if (!titleMatch && !descriptionMatch) {
              return false;
            }
          }

          return true;
        })
      }))
    };
  }, [board, filters.searchText, filters.assigneeId]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleAddColumn = async () => {
    if (!newColumnName.trim()) return;
    
    await createColumn(board.id, newColumnName);
    setNewColumnName('');
    setIsAddingColumn(false);
  };

  const allTasks = useMemo(() => 
    filteredBoard.columns.flatMap(column => column.tasks || []), 
    [filteredBoard.columns]
  );

  const handleDragStart = useCallback(() => {
    // Optional: Add visual feedback - DragStartEvent available when needed
  }, []);

  const handleDragOver = useCallback(() => {
    // Optional: Add visual feedback - DragOverEvent available when needed
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const draggedTask = allTasks.find((task: {id: string}) => task.id === active.id);
    const targetTask = allTasks.find((task: {id: string}) => task.id === over.id);

    if (!draggedTask || !targetTask) return;

    // Moving task to different column
    if (draggedTask.column_id !== targetTask.column_id) {
      await moveCard(draggedTask.id, targetTask.column_id, 0);
    } else {
      // Reordering within same column
      const sourceColumnTasks = allTasks.filter((task: {column_id: string}) => task.column_id === draggedTask.column_id);
      const sourceIndex = sourceColumnTasks.findIndex((task: {id: string}) => task.id === draggedTask.id);
      const targetIndex = sourceColumnTasks.findIndex((task: {id: string}) => task.id === targetTask.id);
      
      if (sourceIndex !== targetIndex) {
        await moveCard(draggedTask.id, draggedTask.column_id, targetIndex);
      }
    }
  }, [allTasks, moveCard]);

  return (
    <BoardErrorBoundary>
       <div className={cn("flex flex-col h-full bg-gray-100 dark:bg-gray-950", className)}>
        {/* Board Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {board.name}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {filteredBoard.columns.length} colunas • {filteredBoard.columns.reduce((acc, col) => acc + (col.tasks?.length || 0), 0)} tasks
              {(filters.searchText || filters.assigneeId) && (
                <span className="ml-2 text-blue-600 dark:text-blue-400">
                  (filtered)
                </span>
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
       </div>

       {/* Board Filters */}
       <div className="px-6 pt-4">
         <BoardFilters 
           filters={filters}
           onFiltersChange={setFilters}
         />
       </div>

       {/* Add Column Form */}
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
              onClick={handleAddColumn}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Adicionar
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

      {/* Board Content */}
      <div className="flex-1 p-6 overflow-x-auto">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={filteredBoard.columns.map(col => col.id)} strategy={horizontalListSortingStrategy}>
            <div className="flex gap-6 h-full">
              {filteredBoard.columns.map((column) => (
                <ColumnComponent
                  key={column.id}
                  column={column}
                  tasks={column.tasks || []}
                />
              ))}
              
              {/* Add Column Placeholder */}
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
      />
     </BoardErrorBoundary>
   );
 }