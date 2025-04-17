import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { SettingsExportImport } from '../../components/Settings/SettingsExportImport';
import { I18nProvider } from '../../contexts/I18nContext';

// Mock the SettingsContext
vi.mock('../../contexts/SettingsContext', () => ({
  useSettings: () => ({
    exportSettings: vi.fn().mockResolvedValue('{}'),
    importSettings: vi.fn().mockResolvedValue(true),
  }),
}));

// Mock the loggerService
vi.mock('../../services/LoggerService', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock the offlineService
vi.mock('../../services/OfflineService', () => ({
  default: {
    getOnlineStatus: vi.fn().mockReturnValue(true),
    addOnlineStatusListener: vi.fn().mockReturnValue(() => {}),
  },
}));

describe('SettingsExportImport i18n', () => {
  const renderComponent = (locale = 'en') => {
    render(
      <I18nProvider initialLocale={locale}>
        <SettingsExportImport />
      </I18nProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with English translations by default', () => {
    renderComponent();

    // Check section title and description
    expect(screen.getByText('Export/Import Settings')).toBeInTheDocument();
    expect(
      screen.getByText('Export your settings to a file or import settings from a file.')
    ).toBeInTheDocument();

    // Check export section
    expect(screen.getAllByText('Export Settings')[0]).toBeInTheDocument();
    expect(
      screen.getByText(
        'Export all your settings, color schemes, and node preferences to a JSON file. You can use this file to backup your settings or transfer them to another device.'
      )
    ).toBeInTheDocument();

    // Check import section
    expect(screen.getAllByText('Import Settings')[0]).toBeInTheDocument();
    expect(
      screen.getByText(
        'Import settings from a previously exported JSON file. This will replace your current settings, color schemes, and node preferences.'
      )
    ).toBeInTheDocument();
  });

  it('renders with German translations', () => {
    renderComponent('de');

    // Check section title and description
    expect(screen.getByText('Einstellungen exportieren/importieren')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Exportieren Sie Ihre Einstellungen in eine Datei oder importieren Sie Einstellungen aus einer Datei.'
      )
    ).toBeInTheDocument();

    // Check export section
    expect(screen.getAllByText('Einstellungen exportieren')[0]).toBeInTheDocument();
    expect(
      screen.getByText(
        /Exportieren Sie alle Ihre Einstellungen, Farbschemata und Knotenpräferenzen in eine JSON-Datei/
      )
    ).toBeInTheDocument();

    // Check import section
    expect(screen.getAllByText('Einstellungen importieren')[0]).toBeInTheDocument();
    expect(
      screen.getByText(/Importieren Sie Einstellungen aus einer zuvor exportierten JSON-Datei/)
    ).toBeInTheDocument();
  });

  it('renders with French translations', () => {
    renderComponent('fr');

    // Check section title and description
    expect(screen.getByText('Exporter/Importer les paramètres')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Exportez vos paramètres vers un fichier ou importez des paramètres depuis un fichier.'
      )
    ).toBeInTheDocument();

    // Check export section
    expect(screen.getAllByText('Exporter les paramètres')[0]).toBeInTheDocument();
    expect(
      screen.getByText(
        /Exportez tous vos paramètres, schémas de couleurs et préférences de nœuds dans un fichier JSON/
      )
    ).toBeInTheDocument();

    // Check import section
    expect(screen.getAllByText('Importer les paramètres')[0]).toBeInTheDocument();
    expect(
      screen.getByText(/Importez les paramètres depuis un fichier JSON précédemment exporté/)
    ).toBeInTheDocument();
  });

  it('renders with Spanish translations', () => {
    renderComponent('es');

    // Check section title and description
    expect(screen.getByText('Exportar/Importar configuración')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Exporte su configuración a un archivo o importe configuración desde un archivo.'
      )
    ).toBeInTheDocument();

    // Check export section
    expect(screen.getAllByText('Exportar configuración')[0]).toBeInTheDocument();
    expect(
      screen.getByText(
        /Exporte toda su configuración, esquemas de colores y preferencias de nodos a un archivo JSON/
      )
    ).toBeInTheDocument();

    // Check import section
    expect(screen.getAllByText('Importar configuración')[0]).toBeInTheDocument();
    expect(
      screen.getByText(/Importe la configuración desde un archivo JSON exportado previamente/)
    ).toBeInTheDocument();
  });
});
