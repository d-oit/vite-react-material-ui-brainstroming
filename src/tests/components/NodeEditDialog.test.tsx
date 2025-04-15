import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { MemoizedNodeEditDialog as NodeEditDialog } from '../../components/BrainstormFlow/NodeEditDialog';
import { NodeType, NodeSize } from '../../types';
import type { NodeData } from '../../types';
import { render } from '../test-utils';

describe('NodeEditDialog', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();

  const editInitialData: NodeData = {
    id: 'node-1',
    title: 'Test Node',
    label: 'Test Node',
    content: 'This is a test node',
    tags: ['tag1'],
    color: '#e3f2fd',
    size: NodeSize.MEDIUM,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    type: NodeType.IDEA,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with the correct initial values in edit mode', () => {
    render(
      <NodeEditDialog
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialData={editInitialData}
        initialType={NodeType.IDEA}
      />
    );

    expect(screen.getByText('Edit Node')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /label/i })).toHaveValue('Test Node');
    expect(screen.getByRole('textbox', { name: /content/i })).toHaveValue('This is a test node');

    const tagListBox = screen.getByRole('textbox', { name: /add tag/i }).parentElement?.nextElementSibling;
    expect(tagListBox).toBeInstanceOf(HTMLElement); // Check if it's an HTMLElement
    if (tagListBox) { // Null check
       expect(within(tagListBox as HTMLElement).getByText('tag1')).toBeInTheDocument(); // Cast to HTMLElement
    }
  });

  it('calls onSave with the updated values when the save button is clicked', async () => {
    render(
      <NodeEditDialog
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialData={editInitialData}
        initialType={NodeType.IDEA}
      />
    );

    fireEvent.change(screen.getByRole('textbox', { name: /label/i }), { target: { value: 'Updated Label' } });
    fireEvent.change(screen.getByRole('textbox', { name: /content/i }), { target: { value: 'Updated content' } });

    const actions = screen.getByRole('dialog').querySelector('.MuiDialogActions-root');
    expect(actions).toBeInstanceOf(HTMLElement); // Check
    if (actions) { // Null check
        fireEvent.click(within(actions as HTMLElement).getByRole('button', { name: 'Save' })); // Cast
    }

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          label: 'Updated Label',
          title: 'Updated Label',
          content: 'Updated content',
          tags: ['tag1'],
          color: '#e3f2fd',
          size: NodeSize.MEDIUM,
        }),
        NodeType.IDEA
      );
    });
  });

  it('calls onClose when the cancel button is clicked', () => {
    render(
      <NodeEditDialog
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialData={editInitialData}
        initialType={NodeType.IDEA}
      />
    );
    const actions = screen.getByRole('dialog').querySelector('.MuiDialogActions-root');
    expect(actions).toBeInstanceOf(HTMLElement); // Check
     if (actions) { // Null check
        fireEvent.click(within(actions as HTMLElement).getByRole('button', { name: 'Cancel' })); // Cast
    }
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('allows adding and removing tags', async () => {
    render(
      <NodeEditDialog
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialData={editInitialData}
        initialType={NodeType.IDEA}
      />
    );

    const tagInput = screen.getByRole('textbox', { name: /add tag/i });
    fireEvent.change(tagInput, { target: { value: 'tag2' } });
    fireEvent.keyDown(tagInput, { key: 'Enter', code: 'Enter', charCode: 13 });

    const tagListBox = screen.getByRole('textbox', { name: /add tag/i }).parentElement?.nextElementSibling;
    expect(tagListBox).toBeInstanceOf(HTMLElement); // Check
    if (!tagListBox) throw new Error("Could not find tag list container");

    await waitFor(() => {
      expect(within(tagListBox as HTMLElement).getByText('tag2')).toBeInTheDocument(); // Cast
    });

    const tag1Chip = within(tagListBox as HTMLElement).getByText('tag1').closest('.MuiChip-root'); // Cast
    expect(tag1Chip).toBeInstanceOf(HTMLElement); // Check
    if (!tag1Chip) throw new Error("Could not find tag1 chip");

    const deleteIcon = within(tag1Chip as HTMLElement).getByTestId('CancelIcon'); // Cast
    fireEvent.click(deleteIcon);

    await waitFor(() => {
      expect(within(tagListBox as HTMLElement).queryByText('tag1')).not.toBeInTheDocument(); // Cast
    });

    const actions = screen.getByRole('dialog').querySelector('.MuiDialogActions-root');
    expect(actions).toBeInstanceOf(HTMLElement); // Check
    if (actions) { // Null check
        fireEvent.click(within(actions as HTMLElement).getByRole('button', { name: 'Save' })); // Cast
    }

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: ['tag2'],
        }),
        NodeType.IDEA
      );
    });
  });

  it('allows changing the node type and preserves color', async () => {
    render(
      <NodeEditDialog
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialData={editInitialData}
        initialType={NodeType.IDEA}
      />
    );

    fireEvent.mouseDown(screen.getByRole('combobox', { name: /node type/i }));
    await screen.findByRole('listbox');
    fireEvent.click(screen.getByRole('option', { name: 'Task' }));

    const actions = screen.getByRole('dialog').querySelector('.MuiDialogActions-root');
    expect(actions).toBeInstanceOf(HTMLElement); // Check
    if (actions) { // Null check
        fireEvent.click(within(actions as HTMLElement).getByRole('button', { name: 'Save' })); // Cast
    }

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          color: '#e3f2fd',
          size: NodeSize.MEDIUM,
        }),
        NodeType.TASK
      );
    });
  });

  it('allows changing the node size and preserves color', async () => {
    render(
      <NodeEditDialog
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialData={editInitialData}
        initialType={NodeType.IDEA}
      />
    );

    fireEvent.mouseDown(screen.getByRole('combobox', { name: /size/i }));
    await screen.findByRole('listbox');
    fireEvent.click(screen.getByRole('option', { name: 'Large' }));

    const actions = screen.getByRole('dialog').querySelector('.MuiDialogActions-root');
    expect(actions).toBeInstanceOf(HTMLElement); // Check
     if (actions) { // Null check
        fireEvent.click(within(actions as HTMLElement).getByRole('button', { name: 'Save' })); // Cast
    }

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          color: '#e3f2fd',
          size: NodeSize.LARGE,
        }),
        NodeType.IDEA
      );
    });
  });

  it('renders in add mode when no initialData is provided', () => {
    render(
      <NodeEditDialog
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialType={NodeType.IDEA}
      />
    );

    expect(screen.getByText('Add New Node')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /label/i })).toHaveValue('');
    expect(screen.getByRole('textbox', { name: /content/i })).toHaveValue('');

    const actions = screen.getByRole('dialog').querySelector('.MuiDialogActions-root');
    expect(actions).toBeInstanceOf(HTMLElement); // Check
    if (actions) { // Null check
        expect(within(actions as HTMLElement).getByRole('button', { name: 'Add' })).toBeInTheDocument(); // Cast
        expect(within(actions as HTMLElement).queryByRole('button', { name: 'Save' })).not.toBeInTheDocument(); // Cast
    }
  });
});
