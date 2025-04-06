import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '../test-utils';
import CustomNode from '../../components/BrainstormFlow/CustomNode';
import { NodeType } from '../../types';
import { mockResizeObserver } from '../test-utils';

describe('CustomNode', () => {
  beforeEach(() => {
    // Mock ResizeObserver
    mockResizeObserver();
  });

  it('renders a node with the correct label and content', () => {
    // Create test data
    const nodeData = {
      label: 'Test Node',
      content: 'This is a test node',
      tags: ['tag1', 'tag2'],
      onEdit: vi.fn(),
      onDelete: vi.fn(),
    };

    // Render the component
    render(
      <CustomNode
        id="node-1"
        type={NodeType.IDEA}
        data={nodeData}
        selected={false}
        zIndex={1}
        isConnectable={true}
        xPos={0}
        yPos={0}
        dragging={false}
      />
    );

    // Check that the label and content are rendered
    expect(screen.getByText('Test Node')).toBeInTheDocument();
    expect(screen.getByText('This is a test node')).toBeInTheDocument();

    // Check that the tags are rendered
    expect(screen.getByText('tag1')).toBeInTheDocument();
    expect(screen.getByText('tag2')).toBeInTheDocument();
  });

  it('calls onEdit when the edit button is clicked', () => {
    // Create test data
    const onEdit = vi.fn();
    const nodeData = {
      label: 'Test Node',
      content: 'This is a test node',
      tags: [],
      onEdit,
      onDelete: vi.fn(),
    };

    // Render the component
    render(
      <CustomNode
        id="node-1"
        type={NodeType.IDEA}
        data={nodeData}
        selected={false}
        zIndex={1}
        isConnectable={true}
        xPos={0}
        yPos={0}
        dragging={false}
      />
    );

    // Find the edit button and click it
    const editButton = screen.getByLabelText('Edit node');
    fireEvent.click(editButton);

    // Check that onEdit was called with the correct ID
    expect(onEdit).toHaveBeenCalledWith('node-1');
  });

  it('calls onDelete when the delete button is clicked', () => {
    // Create test data
    const onDelete = vi.fn();
    const nodeData = {
      label: 'Test Node',
      content: 'This is a test node',
      tags: [],
      onEdit: vi.fn(),
      onDelete,
    };

    // Render the component
    render(
      <CustomNode
        id="node-1"
        type={NodeType.IDEA}
        data={nodeData}
        selected={false}
        zIndex={1}
        isConnectable={true}
        xPos={0}
        yPos={0}
        dragging={false}
      />
    );

    // Find the delete button and click it
    const deleteButton = screen.getByLabelText('Delete node');
    fireEvent.click(deleteButton);

    // Check that onDelete was called with the correct ID
    expect(onDelete).toHaveBeenCalledWith('node-1', expect.any(Object));
  });

  it('collapses content on mobile when it is too long', () => {
    // Mock window.innerWidth to simulate mobile
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 400, // Mobile width
    });

    // Create test data with long content
    const longContent = 'a'.repeat(200); // Content longer than 100 characters
    const nodeData = {
      label: 'Test Node',
      content: longContent,
      tags: [],
      onEdit: vi.fn(),
      onDelete: vi.fn(),
    };

    // Render the component
    render(
      <CustomNode
        id="node-1"
        type={NodeType.IDEA}
        data={nodeData}
        selected={false}
        zIndex={1}
        isConnectable={true}
        xPos={0}
        yPos={0}
        dragging={false}
      />
    );

    // Check that the content is collapsed
    expect(screen.getByText(/tap to expand/)).toBeInTheDocument();
  });

  it('calls onEdit when collapsed content is clicked', () => {
    // Mock window.innerWidth to simulate mobile
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 400, // Mobile width
    });

    // Create test data with long content
    const longContent = 'a'.repeat(200); // Content longer than 100 characters
    const onEdit = vi.fn();
    const nodeData = {
      label: 'Test Node',
      content: longContent,
      tags: [],
      onEdit,
      onDelete: vi.fn(),
    };

    // Render the component
    render(
      <CustomNode
        id="node-1"
        type={NodeType.IDEA}
        data={nodeData}
        selected={false}
        zIndex={1}
        isConnectable={true}
        xPos={0}
        yPos={0}
        dragging={false}
      />
    );

    // Find the collapsed content and click it
    const collapsedContent = screen.getByText(/tap to expand/);
    fireEvent.click(collapsedContent);

    // Check that onEdit was called with the correct ID
    expect(onEdit).toHaveBeenCalledWith('node-1');
  });

  it('applies different styles based on node type', () => {
    // Render nodes of different types
    const nodeData = {
      label: 'Test Node',
      content: 'This is a test node',
      tags: [],
      onEdit: vi.fn(),
      onDelete: vi.fn(),
    };

    const { rerender } = render(
      <CustomNode
        id="node-1"
        type={NodeType.IDEA}
        data={nodeData}
        selected={false}
        zIndex={1}
        isConnectable={true}
        xPos={0}
        yPos={0}
        dragging={false}
      />
    );

    // Get the card element for the IDEA node
    const ideaNode = document.querySelector('.MuiCard-root');
    const ideaStyle = window.getComputedStyle(ideaNode!);
    const ideaBackgroundColor = ideaStyle.backgroundColor;

    // Rerender with a different node type
    rerender(
      <CustomNode
        id="node-1"
        type={NodeType.TASK}
        data={nodeData}
        selected={false}
        zIndex={1}
        isConnectable={true}
        xPos={0}
        yPos={0}
        dragging={false}
      />
    );

    // Get the card element for the TASK node
    const taskNode = document.querySelector('.MuiCard-root');
    const taskStyle = window.getComputedStyle(taskNode!);
    const taskBackgroundColor = taskStyle.backgroundColor;

    // Check that the background colors are different
    expect(ideaBackgroundColor).not.toBe(taskBackgroundColor);
  });
});
