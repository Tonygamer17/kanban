import { Column } from '@/types/kanban';
import { Card } from '@/types/kanban';

export const mockCard: Card = {
  id: '1',
  title: 'Test Card',
  description: 'Test Description',
  column_id: '1',
  order_index: 0,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

export const mockColumn: Column = {
  id: '1',
  name: 'Test Column',
  board_id: '1',
  position: 0,
  created_at: '2024-01-01T00:00:00Z'
};