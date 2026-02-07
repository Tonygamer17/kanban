'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useKanbanStore } from '@/lib/store';
import { BoardComponent } from '@/components/kanban/Board';
import { Plus, Loader2 } from 'lucide-react';
import { fetchBoardWithColumns } from '@/lib/store';
import { useAuth } from '@/components/AuthContextProvider'; // NEW
import { Team } from '@/types/kanban'; // NEW



export default function HomePage() {
  
  
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [isCreatingBoard, setIsCreatingBoard] = useState(false);
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const fetchedTeamsForUserRef = useRef<string | null>(null);
  const { user, signOut } = useAuth(); // Get user and signOut from auth context
  
  
  
  const {
    boards,
    currentBoard,
    loading,
    error,
    fetchBoards,
    createBoard,
    setCurrentBoard,
    teams, // NEW
    fetchTeams, // NEW
    createTeam // NEW
  } = useKanbanStore();

  const uniqueTeams = useMemo(() => {
    const byId = new Map<string, Team>();
    for (const team of teams) {
      if (team?.id && !byId.has(team.id)) {
        byId.set(team.id, team);
      }
    }
    return Array.from(byId.values());
  }, [teams]);

  const uniqueBoards = useMemo(() => {
    const byId = new Map<string, (typeof boards)[number]>();
    for (const board of boards) {
      if (board?.id && !byId.has(board.id)) {
        byId.set(board.id, board);
      }
    }
    return Array.from(byId.values());
  }, [boards]);

  const sidebarTeamGroups = useMemo(() => {
    const byName = new Map<
      string,
      {
        id: string;
        name: string;
        teamIds: string[];
      }
    >();

    for (const team of uniqueTeams) {
      const normalizedName = team.name.trim().toLowerCase();
      const existing = byName.get(normalizedName);

      if (existing) {
        existing.teamIds.push(team.id);
      } else {
        byName.set(normalizedName, {
          id: team.id,
          name: team.name,
          teamIds: [team.id],
        });
      }
    }

    return Array.from(byName.values());
  }, [uniqueTeams]);

  const renderTeamOptions = () => {
    const options = [];
    for (const team of uniqueTeams) {
      options.push(
        <option key={team.id} value={team.id}>
          {team.name}
        </option>
      );
    }
    return options;
  };
  
  

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
    if (!user?.id) {
      fetchedTeamsForUserRef.current = null;
      return;
    }

    if (fetchedTeamsForUserRef.current === user.id) {
      return;
    }
    fetchedTeamsForUserRef.current = user.id;
    fetchTeams(user.id);
  }, [user?.id, fetchTeams]);

  useEffect(() => {
    if (isCreatingBoard) {
      return;
    }

    if (uniqueBoards.length > 0 && !selectedBoardId) {
      // Auto-select first board
      const firstBoard = uniqueBoards[0];
      setSelectedBoardId(firstBoard.id);
      loadBoard(firstBoard.id);
    }
  }, [uniqueBoards, selectedBoardId, loadBoard, isCreatingBoard]);

  useEffect(() => {
    if (!selectedTeamId && uniqueTeams.length > 0) {
      setSelectedTeamId(uniqueTeams[0].id);
    }
  }, [uniqueTeams, selectedTeamId]);

  const handleCreateBoard = async () => {
    
    if (!newBoardTitle.trim()) {
      
      return;
    }

    const targetTeamId = selectedTeamId || uniqueTeams[0]?.id;
    
    if (!targetTeamId) {
      console.error('❌ ERROR: No team ID available to create board.');
      return;
    }

    try {
      await createBoard(newBoardTitle, targetTeamId); // Pass targetTeamId
      setNewBoardTitle('');
      setIsCreatingBoard(false);
      setSelectedTeamId(targetTeamId);
      
    } catch (error) {
      console.error('❌ ERROR: Board creation failed:', error);
    }
  };

  const handleCreateFirstTeam = async () => {
    if (!user?.id || isCreatingTeam) {
      return;
    }

    const existingDefaultTeam = uniqueTeams.find(
      (team) => team.name.trim().toLowerCase() === 'my first team'
    );

    if (existingDefaultTeam) {
      setSelectedTeamId(existingDefaultTeam.id);
      return;
    }

    setIsCreatingTeam(true);
    try {
      const team = await createTeam('My First Team', user.id);
      setSelectedTeamId(team.id);
    } catch (error) {
      console.error('❌ ERROR: Failed to create first team:', error);
    } finally {
      setIsCreatingTeam(false);
    }
  };

  const handleBoardSelect = (boardId: string) => {
    setSelectedBoardId(boardId);
    loadBoard(boardId);
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
                    onClick={handleCreateFirstTeam}
                    disabled={isCreatingTeam}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors mr-4"
                  >
                    <Plus size={20} />
                    <span>{isCreatingTeam ? 'Criando...' : 'Criar Primeiro Team'}</span>
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
          {sidebarTeamGroups.length > 0 ? (
            sidebarTeamGroups.map((teamGroup) => (
              <div key={teamGroup.id} className="mb-4">
                <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-2">{teamGroup.name}</h3>
                <div className="space-y-2 pl-2">
                  {uniqueBoards
                    .filter((board) => teamGroup.teamIds.includes(board.team_id))
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
                      setCurrentBoard(null);
                      setSelectedTeamId(teamGroup.id);
                      setIsCreatingBoard(true);
                    }}
                    className="mt-2 w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <Plus size={14} />
                    <span>Novo Board para {teamGroup.name}</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400">
              Nenhum time encontrado. Crie um novo.
              <button
                onClick={() => {
                  handleCreateFirstTeam();
                }}
                disabled={isCreatingTeam}
                className="mt-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                {isCreatingTeam ? 'Criando...' : 'Criar Primeiro Time'}
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
                {uniqueTeams.length > 0 && (
                  <div className="mb-4">
                    <label htmlFor="team-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Selecionar Time
                    </label>
                    <select
                      id="team-select"
                      onChange={(e) => setSelectedTeamId(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={selectedTeamId || uniqueTeams[0]?.id || ''}
                      disabled={uniqueTeams.length === 0}
                    >
                      {renderTeamOptions()}
                    </select>
                  </div>
                )}
                {uniqueTeams.length === 0 && (
                  <p className="mb-4 text-sm text-yellow-700 dark:text-yellow-400">
                    Crie um time primeiro para poder criar um board.
                  </p>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={handleCreateBoard}
                    disabled={uniqueTeams.length === 0}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Criar Board
                  </button>
                  <button
                    onClick={() => {
                      setNewBoardTitle('');
                      setIsCreatingBoard(false);
                       setSelectedBoardId(uniqueBoards[0]?.id || null); // Go back to first board or null
                       if (uniqueBoards.length > 0) loadBoard(uniqueBoards[0].id);
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
