'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useKanbanStore } from '@/lib/store';
import { BoardComponent } from '@/components/kanban/Board';
import { Plus, Loader2, FolderOpen, AlertCircle } from 'lucide-react';
import { fetchBoardWithColumns } from '@/lib/store';
import { useAuth } from '@/components/AuthContextProvider'; // NEW
import { Team } from '@/types/kanban'; // NEW
import { BoardsSidebar } from '@/components/kanban/BoardsSidebar';



export default function HomePage() {
  
  
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [isCreatingBoard, setIsCreatingBoard] = useState(false);
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [isBoardLoading, setIsBoardLoading] = useState(false);
  const [boardLoadError, setBoardLoadError] = useState<string | null>(null);
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

  const visibleBoards = useMemo(() => {
    const teamIds = new Set(uniqueTeams.map((team) => team.id));
    return uniqueBoards.filter((board) => teamIds.has(board.team_id));
  }, [uniqueBoards, uniqueTeams]);

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

  const loadBoard = useCallback(async (boardId: string) => {
    setIsBoardLoading(true);
    setBoardLoadError(null);

    try {
      const timeoutPromise = new Promise<null>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout ao carregar o board')), 10000);
      });

      const boardData = await Promise.race([fetchBoardWithColumns(boardId), timeoutPromise]);
      
      if (boardData) {
        setCurrentBoard(boardData);
      } else {
        setCurrentBoard(null);
        setBoardLoadError('Nao foi possivel carregar este board.');
      }
    } catch (error) {
      console.error('❌ ERROR: loadBoard failed:', error);
      setCurrentBoard(null);
      setBoardLoadError('Falha ao carregar o board.');
    } finally {
      setIsBoardLoading(false);
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

    if (visibleBoards.length > 0 && !selectedBoardId) {
      // Auto-select first board
      const firstBoard = visibleBoards[0];
      setSelectedBoardId(firstBoard.id);
      loadBoard(firstBoard.id);
    }
  }, [visibleBoards, selectedBoardId, loadBoard, isCreatingBoard]);

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
      (team) => team.name.trim().toLowerCase() === 'workspace'
    );

    if (existingDefaultTeam) {
      setSelectedTeamId(existingDefaultTeam.id);
      return;
    }

    setIsCreatingTeam(true);
    try {
      const team = await createTeam('Workspace', user.id);
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

  const handleQuickCreateBoard = async () => {
    let targetTeamId = selectedTeamId || uniqueTeams[0]?.id;

    if (!targetTeamId) {
      if (!user?.id) return;
      const team = await createTeam('Workspace', user.id);
      targetTeamId = team.id;
      setSelectedTeamId(team.id);
    }

    await createBoard('Meu primeiro board', targetTeamId);
    setSelectedBoardId(null);
    setIsCreatingBoard(false);
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

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-950">
      <BoardsSidebar
        teamGroups={sidebarTeamGroups}
        boards={visibleBoards}
        selectedBoardId={selectedBoardId}
        isCreatingTeam={isCreatingTeam}
        onSelectBoard={handleBoardSelect}
        onCreateBoardForTeam={(teamId) => {
          setSelectedBoardId(null);
          setBoardLoadError(null);
          setCurrentBoard(null);
          setSelectedTeamId(teamId);
          setIsCreatingBoard(true);
        }}
        onCreateFirstTeam={handleCreateFirstTeam}
        onSignOut={signOut}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {currentBoard ? (
          <BoardComponent board={currentBoard} />
        ) : isBoardLoading ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 text-center w-full max-w-md">
              <Loader2 className="animate-spin mx-auto mb-4 text-gray-500" size={30} />
              <p className="text-gray-700 dark:text-gray-300 font-medium">Carregando board...</p>
            </div>
          </div>
        ) : boardLoadError ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 text-center w-full max-w-md">
              <AlertCircle className="mx-auto mb-4 text-red-500" size={28} />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Erro ao carregar board</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-2">{boardLoadError}</p>
              <button
                onClick={() => {
                  if (selectedBoardId) {
                    loadBoard(selectedBoardId);
                  } else {
                    fetchBoards();
                  }
                }}
                className="mt-5 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        ) : visibleBoards.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 text-center w-full max-w-md">
              <FolderOpen className="mx-auto mb-4 text-gray-400" size={30} />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Nenhum board ainda</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Crie seu primeiro board para começar</p>
              <button
                onClick={handleQuickCreateBoard}
                className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
              >
                <Plus size={16} />
                Criar board
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-6">
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
                      setBoardLoadError(null);
                       setSelectedBoardId(visibleBoards[0]?.id || null); // Go back to first board or null
                       if (visibleBoards.length > 0) loadBoard(visibleBoards[0].id);
                      }}
                    className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 text-center w-full max-w-md">
                <FolderOpen className="mx-auto mb-4 text-gray-400" size={30} />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Selecione um board no menu</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Escolha um board na sidebar para visualizar suas colunas e tasks.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
