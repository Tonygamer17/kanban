'use client';

import { useEffect, useState, useCallback } from 'react';
import { useKanbanStore } from '@/lib/store';
import { BoardComponent } from '@/components/kanban/Board';
import { Plus, Loader2, Pencil, Trash2 } from 'lucide-react';
import { fetchBoardWithColumns } from '@/lib/store';
import { useAuth } from '@/components/AuthContextProvider'; // NEW
import { Team } from '@/types/kanban'; // NEW



export default function HomePage() {
  
  
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [isCreatingBoard, setIsCreatingBoard] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const { user, signOut } = useAuth(); // Get user and signOut from auth context
  
  
  
  const { 
    boards, 
    currentBoard, 
    loading, 
    error, 
    fetchBoards, 
    createBoard, 
    updateBoard,
    deleteBoard,
    setCurrentBoard,
    teams, // NEW
    fetchTeams, // NEW
    createTeam // NEW
  } = useKanbanStore();

  // Estados para edição de board
  const [editingBoardId, setEditingBoardId] = useState<string | null>(null);
  const [editingBoardName, setEditingBoardName] = useState('');
  const [editingBoardDescription, setEditingBoardDescription] = useState('');
  
  

  const loadBoard = useCallback(async (boardId: string) => {
    
    try {
      const boardData = await fetchBoardWithColumns(boardId);
      
      if (boardData) {
        setCurrentBoard(boardData);
      }
    } catch (error) {
      console.error('❌ ERROR: loadBoard failed:', error);
    }
  }, [setCurrentBoard]);

  useEffect(() => {
    
    fetchBoards();
  }, [fetchBoards]);

  // NEW useEffect to fetch teams for the authenticated user
  useEffect(() => {
    if (user?.id) {
      
      fetchTeams(user.id);
    }
  }, [user?.id, fetchTeams]);

  useEffect(() => {
    
    
    if (boards.length > 0 && !selectedBoardId) {
      // Auto-select first board
      const firstBoard = boards[0];
      
      setTimeout(() => {
        setSelectedBoardId(firstBoard.id);
        loadBoard(firstBoard.id);
      }, 0);
    }
  }, [boards, selectedBoardId, loadBoard]);

  const handleCreateBoard = async () => {
    
    if (!newBoardTitle.trim()) {
      
      return;
    }

    let targetTeamId: string | undefined;

    if (teams.length > 0) {
      targetTeamId = teams[0].id; // Use the first available team
      
    } else if (user?.id) {
      // If no teams, create a default team for the user
      
      try {
        const defaultTeam = await createTeam('My First Team', user.id);
        targetTeamId = defaultTeam.id;
        
      } catch (err) {
        console.error('❌ ERROR: Failed to create default team:', err);
        return; // Stop if team creation fails
      }
    } else {
      console.error('❌ ERROR: Cannot create board without a user or team.');
      return;
    }
    
    if (!targetTeamId) {
      console.error('❌ ERROR: No team ID available to create board.');
      return;
    }

    try {
      await createBoard(newBoardTitle, targetTeamId); // Pass targetTeamId
      setNewBoardTitle('');
      setIsCreatingBoard(false);
      
    } catch (error) {
      console.error('❌ ERROR: Board creation failed:', error);
    }
  };

  const handleBoardSelect = (boardId: string) => {
    setSelectedBoardId(boardId);
    loadBoard(boardId);
  };

  // Funções para editar board
  const handleStartEdit = (board: typeof boards[0]) => {
    setEditingBoardId(board.id);
    setEditingBoardName(board.name);
    setEditingBoardDescription(board.description || '');
  };

  const handleCancelEdit = () => {
    setEditingBoardId(null);
    setEditingBoardName('');
    setEditingBoardDescription('');
  };

  const handleSaveEdit = async (boardId: string) => {
    if (!editingBoardName.trim()) return;
    
    try {
      await updateBoard(boardId, editingBoardName, editingBoardDescription);
      setEditingBoardId(null);
      setEditingBoardName('');
      setEditingBoardDescription('');
    } catch (err) {
      console.error('Failed to update board:', err);
    }
  };

  const handleDeleteBoard = async (boardId: string, boardName: string) => {
    if (confirm(`Tem certeza que deseja excluir o board "${boardName}"?\nEsta ação não pode ser desfeita.`)) {
      try {
        await deleteBoard(boardId);
        if (selectedBoardId === boardId) {
          setSelectedBoardId(null);
          setCurrentBoard(null);
        }
      } catch (err) {
        console.error('Failed to delete board:', err);
      }
    }
  };

  if (loading && boards.length === 0 && teams.length === 0) { // Modified loading condition
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950">
        <div className="flex items-center gap-3">
          <Loader2 className="animate-spin" size={24} />
          <span className="text-gray-600 dark:text-gray-400">Carregando...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950">
        <div className="text-center">
          <div className="text-red-500 mb-4">Erro: {error}</div>
          <button
            onClick={() => {
              fetchBoards();
              if (user?.id) fetchTeams(user.id);
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (boards.length === 0 && teams.length === 0) { // Modified condition for no boards/teams
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Bem-vindo ao Kanban App
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Crie seu primeiro time e board para começar a organizar suas tarefas.
          </p>
          
          {isCreatingBoard ? (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <input
                type="text"
                value={newBoardTitle}
                onChange={(e) => setNewBoardTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                placeholder="Nome do board"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  onClick={handleCreateBoard}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Criar Board
                </button>
                <button
                  onClick={() => {
                    setNewBoardTitle('');
                    setIsCreatingBoard(false);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
                <span>
                  <button
                    onClick={() => setIsCreatingBoard(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors mr-4"
                  >
                    <Plus size={20} />
                    <span>Criar Primeiro Team</span>
                  </button>
                  <button
                    onClick={signOut}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    <span>Sair</span>
                  </button>
                </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-950">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Meus Boards
            </h2>
            <button
              onClick={signOut}
              className="px-3 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              title="Sair"
            >
              <span className="text-xs">Sair</span>
            </button>
          </div>
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto">
          {/* Display teams and boards */}
          {teams.length > 0 ? (
            teams.map((team: Team) => (
              <div key={team.id} className="mb-4">
                <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-2">{team.name}</h3>
                <div className="space-y-2 pl-2">
                  {boards
                    .filter(board => board.team_id === team.id)
                    .map((board) => (
                    <button
                      key={board.id}
                      onClick={() => handleBoardSelect(board.id)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                        selectedBoardId === board.id
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <div className="font-medium">{board.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {new Date(board.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </button>
                  ))}
                  {/* Button to create new board for this team */}
                  <button
                    onClick={() => {
                      setSelectedBoardId(null); // Clear selected board to show "create board" UI for this team
                      setIsCreatingBoard(true);
                      // Potentially open a modal to create board for this team
                    }}
                    className="mt-2 w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <Plus size={14} />
                    <span>Novo Board para {team.name}</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400">
              Nenhum time encontrado. Crie um novo.
              <button
                onClick={() => {
                  if (user?.id) createTeam('My First Team', user.id);
                }}
                className="mt-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Criar Primeiro Time
              </button>
            </div>
          )}


          {/* Old "Create First Board" UI removed or integrated into team sections */}

        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {currentBoard ? (
          <BoardComponent board={currentBoard} />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            {isCreatingBoard ? ( // Show board creation form here if active
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 max-w-md w-full">
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Criar Novo Board</h2>
                <input
                  type="text"
                  value={newBoardTitle}
                  onChange={(e) => setNewBoardTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                  placeholder="Nome do board"
                  autoFocus
                />
                {teams.length > 0 && (
                  <div className="mb-4">
                    <label htmlFor="team-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Selecionar Time
                    </label>
                    <select
                      id="team-select"
                      // You'll need state to manage selected team if multiple exist
                      // For now, auto-select first
                      onChange={() => {
                        // Implement logic to select team, for simplicity, using first team's ID
                      }}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={teams[0]?.id || ''} // Default to first team
                      disabled={teams.length === 0}
                    >
                      {teams.map((team: Team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={handleCreateBoard}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Criar Board
                  </button>
                  <button
                    onClick={() => {
                      setNewBoardTitle('');
                      setIsCreatingBoard(false);
                      setSelectedBoardId(boards[0]?.id || null); // Go back to first board or null
                      if (boards.length > 0) loadBoard(boards[0].id);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <Loader2 className="animate-spin mx-auto mb-4" size={32} />
                <p className="text-gray-600 dark:text-gray-400">Carregando board...</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}