import { describe, it, expect, vi, beforeEach } from 'vitest';

import { SettingsProvider, useSettings } from '../../contexts/SettingsContext';
import { render, screen, fireEvent, waitFor, mockLocalStorage } from '../test-utils';

// Create a test component that uses the SettingsContext
const TestComponent = () => {
  const { settings, updateSettings, exportSettings, importSettings } = useSettings();

  return (
    <div>
      <div data-testid="theme-mode">{settings.themeMode}</div>
      <div data-testid="language">{settings.language}</div>
      <button type="button" onClick={() => updateSettings({ themeMode: 'dark' })}>
        Set Dark Theme
      </button>
      <button type="button" onClick={() => updateSettings({ language: 'de' })}>
        Set German Language
      </button>
      <button
        type="button"
        onClick={async () => {
          const json = await exportSettings();
          document.getElementById('export-result')!.textContent = json;
        }}
      >
        Export Settings
      </button>
      <button type="button" onClick={() => importSettings('{"themeMode":"dark","language":"fr"}')}>
        Import Settings
      </button>
      <div id="export-result" />
    </div>
  );
};

describe('SettingsContext', () => {
  let mockStorage: any;

  beforeEach(() => {
    mockStorage = mockLocalStorage();

    // Reset mocks
    vi.clearAllMocks();
  });

  it('provides default settings when no stored settings exist', () => {
    // Render the test component
    render(
      <SettingsProvider>
        <TestComponent />
      </SettingsProvider>
    );

    // Check that the default settings are provided
    expect(screen.getByTestId('theme-mode')).toHaveTextContent('light');
    expect(screen.getByTestId('language')).toHaveTextContent('en');
  });

  it('loads settings from localStorage', () => {
    // Set up localStorage with stored settings
    mockStorage.getItem.mockReturnValue(
      JSON.stringify({
        themeMode: 'dark',
        language: 'de',
      })
    );

    // Render the test component
    render(
      <SettingsProvider>
        <TestComponent />
      </SettingsProvider>
    );

    // Check that the stored settings are loaded
    expect(screen.getByTestId('theme-mode')).toHaveTextContent('dark');
    expect(screen.getByTestId('language')).toHaveTextContent('de');
  });

  it('updates settings and saves to localStorage', async () => {
    // Render the test component
    render(
      <SettingsProvider>
        <TestComponent />
      </SettingsProvider>
    );

    // Update the theme
    fireEvent.click(screen.getByText('Set Dark Theme'));

    // Check that the settings were updated
    expect(screen.getByTestId('theme-mode')).toHaveTextContent('dark');

    // Check that the settings were saved to localStorage
    await waitFor(() => {
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'settings',
        expect.stringContaining('"themeMode":"dark"')
      );
    });
  });

  it('exports settings to JSON', async () => {
    // Render the test component
    render(
      <SettingsProvider>
        <TestComponent />
      </SettingsProvider>
    );

    // Export the settings
    fireEvent.click(screen.getByText('Export Settings'));

    // Check that the settings were exported
    await waitFor(() => {
      const exportResult = document.getElementById('export-result')!.textContent;
      expect(exportResult).toContain('"themeMode":"light"');
    });

    // Check that language was exported
    const exportResult = document.getElementById('export-result')!.textContent;
    expect(exportResult).toContain('"language":"en"');
  });

  it('imports settings from JSON', async () => {
    // Render the test component
    render(
      <SettingsProvider>
        <TestComponent />
      </SettingsProvider>
    );

    // Import settings
    fireEvent.click(screen.getByText('Import Settings'));

    // Check that the theme mode was imported
    await waitFor(() => {
      expect(screen.getByTestId('theme-mode')).toHaveTextContent('dark');
    });

    // Check that the language was imported
    expect(screen.getByTestId('language')).toHaveTextContent('fr');

    // Check that the settings were saved to localStorage
    expect(mockStorage.setItem).toHaveBeenCalledWith(
      'settings',
      expect.stringContaining('"themeMode":"dark"')
    );
    expect(mockStorage.setItem).toHaveBeenCalledWith(
      'settings',
      expect.stringContaining('"language":"fr"')
    );
  });
});
