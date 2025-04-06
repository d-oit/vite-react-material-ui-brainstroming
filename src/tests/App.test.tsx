import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

// Simple test to verify testing setup works
describe('Basic test', () => {
  it('renders a simple component', () => {
    // Render a simple div
    render(<div data-testid="test-element">Test Element</div>);

    // Check if the element is in the document
    expect(screen.getByTestId('test-element')).toBeInTheDocument();
    expect(screen.getByText('Test Element')).toBeInTheDocument();
  });
});
