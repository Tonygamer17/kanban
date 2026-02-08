'use client';

import React, { useState } from 'react';
import { BoardWithColumns } from '@/types/kanban';

interface EditBoardModalProps {
  board: BoardWithColumns;
  isOpen: boolean;
  onClose: () => void;
  onSave: (boardId: string, newName: string) => Promise<void> | void;
  onDelete: (boardId: string) => Promise<void> | void;
}

export const EditBoardModal: React.FC<EditBoardModalProps> = ({ board, isOpen, onClose, onSave, onDelete }) => {
  const [boardName, setBoardName] = useState(board.name);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setBoardName(board.name);
      setError(null);
      setIsSaving(false);
      setIsDeleting(false);
    }
  }, [isOpen, board.name]);

  const handleSave = async () => {
    const trimmedName = boardName.trim();
    if (!trimmedName || isSaving) return;

    setIsSaving(true);
    setError(null);
    try {
      await onSave(board.id, trimmedName);
      onClose();
    } catch (err) {
      console.error('Failed to save board:', err);
      setError('Nao foi possivel salvar o board. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isDeleting) return;

    if (confirm(`Tem certeza que deseja excluir o board "${board.name}"? Esta acao nao pode ser desfeita.`)) {
      setIsDeleting(true);
      setError(null);
      try {
        await onDelete(board.id);
        onClose();
      } catch (err) {
        console.error('Failed to delete board:', err);
        setError('Nao foi possivel excluir o board. Tente novamente.');
      } finally {
        setIsDeleting(false);
      }
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
        {error && <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={handleDelete}
            disabled={isDeleting || isSaving}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isDeleting ? 'Excluindo...' : 'Excluir Board'}
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isDeleting || isSaving}
              className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || isDeleting || !boardName.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
