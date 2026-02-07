import { Column, Task } from '@/types/kanban';

export const mockTask: Task = {
  id: 'task-1',
  title: 'Test Task',
  description: 'Test Description',
  column_id: 'col-1',
  position: 0,
  created_at: '2024-01-01T00:00:00Z',
  due_date: null,
  priority: 'medium',
  status: 'todo',
};

export const mockColumn: Column = {
  id: 'col-1',
  name: 'Test Column',
  board_id: 'board-1',
  position: 0,
  created_at: '2024-01-01T00:00:00Z',
};
