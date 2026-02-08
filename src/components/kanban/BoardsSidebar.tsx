'use client';

import { Folder, LogOut, Plus } from 'lucide-react';
import { Board } from '@/types/kanban';

interface SidebarTeamGroup {
  id: string;
  name: string;
  teamIds: string[];
}

interface BoardsSidebarProps {
  teamGroups: SidebarTeamGroup[];
  boards: Board[];
  selectedBoardId: string | null;
  isCreatingTeam: boolean;
  onSelectBoard: (boardId: string) => void;
  onCreateBoardForTeam: (teamId: string) => void;
  onCreateFirstTeam: () => void;
  onSignOut: () => void;
}

const getSidebarTeamName = (name: string) => {
  const normalized = name.trim().toLowerCase();
  if (normalized === 'my first team' || normalized === 'primeiro time') {
    return 'Workspace';
  }
  return name;
};

export function BoardsSidebar({
  teamGroups,
  boards,
  selectedBoardId,
  isCreatingTeam,
  onSelectBoard,
  onCreateBoardForTeam,
  onCreateFirstTeam,
  onSignOut,
}: BoardsSidebarProps) {
  return (
    <div className="w-72 bg-gray-950 border-r border-gray-800/90 flex flex-col">
      <div className="p-5 border-b border-gray-800/80">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-wide uppercase text-gray-200">Meus Boards</h2>
          <button
            onClick={onSignOut}
            className="inline-flex items-center justify-center h-8 w-8 rounded-md text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-all duration-200"
            title="Sair"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>

      <div className="flex-1 p-3 overflow-y-auto">
        {teamGroups.length > 0 ? (
          teamGroups.map((teamGroup) => (
            <div key={teamGroup.id} className="mb-5">
              <h3 className="px-3 mb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-gray-500">
                {getSidebarTeamName(teamGroup.name)}
              </h3>
              <div className="space-y-1">
                {boards
                  .filter((board) => teamGroup.teamIds.includes(board.team_id))
                  .map((board) => (
                    <button
                      key={board.id}
                      onClick={() => onSelectBoard(board.id)}
                      className={`group relative w-full text-left px-3 py-2.5 rounded-lg border transition-all duration-200 ${
                        selectedBoardId === board.id
                          ? 'bg-slate-800/80 border-slate-700 text-slate-100 shadow-[inset_2px_0_0_0_#38bdf8]'
                          : 'bg-transparent border-transparent text-gray-300 hover:bg-gray-900 hover:border-gray-800 hover:text-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Folder
                          size={15}
                          className={`${selectedBoardId === board.id ? 'text-sky-300' : 'text-gray-500 group-hover:text-gray-300'} transition-colors`}
                        />
                        <span className="truncate text-sm font-medium">{board.name}</span>
                      </div>
                    </button>
                  ))}

                <button
                  onClick={() => onCreateBoardForTeam(teamGroup.id)}
                  className="mt-2 w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-gray-700 bg-transparent text-gray-300 text-sm font-medium hover:bg-gray-900 hover:border-sky-700/60 hover:text-sky-300 transition-all duration-200"
                >
                  <Plus size={14} />
                  <span>Novo Board</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 dark:text-gray-400">
            Nenhum time encontrado. Crie um novo.
            <button
              onClick={onCreateFirstTeam}
              disabled={isCreatingTeam}
              className="mt-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              {isCreatingTeam ? 'Criando...' : 'Criar Primeiro Time'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
