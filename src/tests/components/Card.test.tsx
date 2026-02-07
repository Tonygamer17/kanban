import { render, screen } from '@testing-library/react';
import { Card } from '@/components/kanban/Card';
import { mockCard } from '../__mocks__/kanban';

describe('Card Component', () => {
  it('renders card title correctly', () => {
    render(<Card card={mockCard} />);
    expect(screen.getByText('Test Card')).toBeInTheDocument();
  });

  it('renders card description when provided', () => {
    render(<Card card={mockCard} />);
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('shows edit and delete buttons on hover', () => {
    render(<Card card={mockCard} />);
    const editButton = screen.getByRole('button', { name: /edit/i });
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    
    expect(editButton).toBeInTheDocument();
    expect(deleteButton).toBeInTheDocument();
  });
});