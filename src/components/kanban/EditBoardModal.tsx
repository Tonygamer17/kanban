'use client';

import React, { useState } from 'react';
import { BoardWithColumns } from '@/types/kanban';

interface EditBoardModalProps {
  board: BoardWithColumns;
  isOpen: boolean;
  onClose: () => void;
  onSave: (boardId: string, newName: string) => void;
  onDelete: (boardId: string) => void;
}

export const EditBoardModal: React.FC<EditBoardModalProps> = ({ board, isOpen, onClose, onSave, onDelete }) => {
  const [boardName, setBoardName] = useState(board.name);

  const handleSave = () => {
    if (boardName.trim()) {
      onSave(board.id, boardName);
      onClose();
    }
  };

  const handleDelete = () => {
    if (confirm(`Tem certeza que deseja excluir o board "${board.name}"? Esta acao nao pode ser desfeita.`)) {
      onDelete(board.id);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Editar Board</h2>
        <div className="mb-4">
          <label htmlFor="boardName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nome do Board
          </label>
          <input
            type="text"
            id="boardName"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={boardName}
            onChange={(e) => setBoardName(e.target.value)}
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Excluir Board
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
