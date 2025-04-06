import { describe, it, expect, vi, beforeEach } from 'vitest';

import { NodeEditDialog } from '../../components/BrainstormFlow/NodeEditDialog';
import { NodeType } from '../../types';
import { render, screen, fireEvent, waitFor } from '../test-utils';

describe('NodeEditDialog', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with the correct initial values', () => {
    // Render the component
    render(
      <NodeEditDialog
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialValues={{
          id: 'node-1',
          type: NodeType.IDEA,
          label: 'Test Node',
          content: 'This is a test node',
          tags: ['tag1', 'tag2'],
          color: '#e3f2fd',
          size: 'medium',
        }}
      />
    );

    // Check that the dialog is rendered
    expect(screen.getByText('Edit Node')).toBeInTheDocument();

    // Check that the initial values are set
    expect(screen.getByLabelText('Title')).toHaveValue('Test Node');
    expect(screen.getByLabelText('Content')).toHaveValue('This is a test node');

    // Check that the tags are rendered
    expect(screen.getByText('tag1')).toBeInTheDocument();
    expect(screen.getByText('tag2')).toBeInTheDocument();
  });

  it('calls onSave with the updated values when the save button is clicked', async () => {
    // Render the component
    render(
      <NodeEditDialog
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialValues={{
          id: 'node-1',
          type: NodeType.IDEA,
          label: 'Test Node',
          content: 'This is a test node',
          tags: ['tag1', 'tag2'],
          color: '#e3f2fd',
          size: 'medium',
        }}
      />
    );

    // Update the title and content
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Updated Title' } });
    fireEvent.change(screen.getByLabelText('Content'), { target: { value: 'Updated content' } });

    // Click the save button
    fireEvent.click(screen.getByText('Save'));

    // Check that onSave was called with the updated values
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        id: 'node-1',
        type: NodeType.IDEA,
        label: 'Updated Title',
        content: 'Updated content',
        tags: ['tag1', 'tag2'],
        color: '#e3f2fd',
        size: 'medium',
      });
    });
  });

  it('calls onClose when the cancel button is clicked', () => {
    // Render the component
    render(
      <NodeEditDialog
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialValues={{
          id: 'node-1',
          type: NodeType.IDEA,
          label: 'Test Node',
          content: 'This is a test node',
          tags: [],
          color: '#e3f2fd',
          size: 'medium',
        }}
      />
    );

    // Click the cancel button
    fireEvent.click(screen.getByText('Cancel'));

    // Check that onClose was called
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('allows adding and removing tags', async () => {
    // Render the component
    render(
      <NodeEditDialog
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialValues={{
          id: 'node-1',
          type: NodeType.IDEA,
          label: 'Test Node',
          content: 'This is a test node',
          tags: ['tag1'],
          color: '#e3f2fd',
          size: 'medium',
        }}
      />
    );

    // Add a new tag
    const tagInput = screen.getByLabelText('Add tag');
    fireEvent.change(tagInput, { target: { value: 'tag2' } });
    fireEvent.keyDown(tagInput, { key: 'Enter', code: 'Enter' });

    // Check that the new tag is rendered
    expect(screen.getByText('tag2')).toBeInTheDocument();

    // Remove a tag
    const deleteIcon = screen.getAllByLabelText('delete')[0]; // First delete icon
    fireEvent.click(deleteIcon);

    // Check that the tag was removed
    expect(screen.queryByText('tag1')).not.toBeInTheDocument();

    // Save the changes
    fireEvent.click(screen.getByText('Save'));

    // Check that onSave was called with the updated tags
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: ['tag2'],
        })
      );
    });
  });

  it('allows changing the node type', async () => {
    // Render the component
    render(
      <NodeEditDialog
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialValues={{
          id: 'node-1',
          type: NodeType.IDEA,
          label: 'Test Node',
          content: 'This is a test node',
          tags: [],
          color: '#e3f2fd',
          size: 'medium',
        }}
      />
    );

    // Change the node type
    fireEvent.mouseDown(screen.getByLabelText('Node Type'));
    fireEvent.click(screen.getByText('Task'));

    // Save the changes
    fireEvent.click(screen.getByText('Save'));

    // Check that onSave was called with the updated type
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          type: NodeType.TASK,
        })
      );
    });
  });

  it('allows changing the node size', async () => {
    // Render the component
    render(
      <NodeEditDialog
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialValues={{
          id: 'node-1',
          type: NodeType.IDEA,
          label: 'Test Node',
          content: 'This is a test node',
          tags: [],
          color: '#e3f2fd',
          size: 'medium',
        }}
      />
    );

    // Toggle size options
    fireEvent.click(screen.getByLabelText('Toggle size options'));

    // Change the node size
    fireEvent.click(screen.getByLabelText('Large size'));

    // Save the changes
    fireEvent.click(screen.getByText('Save'));

    // Check that onSave was called with the updated size
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          size: 'large',
        })
      );
    });
  });
});
