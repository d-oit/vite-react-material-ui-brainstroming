import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';

import { I18nProvider } from '../../contexts/I18nContext';
import ProjectDetailPage from '../ProjectDetailPage';

// Mock the hooks and components
vi.mock('../../hooks/useProject', () => ({
  useProject: () => ({
    project: {
      id: 'test-id',
      name: 'Test Project',
      description: 'Test Description',
      version: '1.0',
      nodes: [],
      edges: [],
      template: 'CUSTOM',
      syncSettings: {
        enableS3Sync: false,
        syncFrequency: 'manual',
        intervalMinutes: 30,
      },
    },
    loading: false,
    error: null,
    isSaving: false,
    hasChanges: false,
    saveProject: vi.fn(),
    createNewVersion: vi.fn(),
  }),
}));

vi.mock('../../components/BrainstormFlow/KeyboardShortcutsHandler', () => ({
  default: () => <div data-testid="keyboard-shortcuts">Keyboard Shortcuts</div>,
}));

vi.mock('../../components/Help/HelpOverlay', () => ({
  default: () => <div data-testid="help-overlay">Help Overlay</div>,
}));

vi.mock('../../components/Project/ProjectBrainstormingSection', () => ({
  ProjectBrainstormingSection: () => <div data-testid="brainstorming-section">Brainstorming Section</div>,
}));

vi.mock('../../components/Project/ProjectSettingsSection', () => ({
  default: () => <div data-testid="settings-section">Settings Section</div>,
}));

vi.mock('../../components/Layout/AppShell', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('../../components/Chat/ChatInterface', () => ({
  ChatInterface: () => <div data-testid="chat-interface">Chat Interface</div>,
}));

describe('ProjectDetailPage i18n', () => {
  const renderComponent = (locale = 'en') => {
    render(
      <I18nProvider initialLocale={locale}>
        <MemoryRouter initialEntries={['/projects/test-id']}>
          <Routes>
            <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
          </Routes>
        </MemoryRouter>
      </I18nProvider>
    );
  };

  it('renders with English translations by default', () => {
    renderComponent();
    
    // Check tab labels
    expect(screen.getByRole('tab', { name: /Overview/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Brainstorm/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Settings/i })).toBeInTheDocument();
    
    // Check other translated elements
    expect(screen.getByText('Project Details')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Edit Description/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /New Version/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Assistant/i })).toBeInTheDocument();
  });

  it('renders with German translations', () => {
    renderComponent('de');
    
    // Check tab labels
    expect(screen.getByRole('tab', { name: /Übersicht/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Brainstorming/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Einstellungen/i })).toBeInTheDocument();
    
    // Check other translated elements
    expect(screen.getByText('Projektdetails')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Beschreibung bearbeiten/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Neue Version/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Assistent/i })).toBeInTheDocument();
  });

  it('renders with French translations', () => {
    renderComponent('fr');
    
    // Check tab labels
    expect(screen.getByRole('tab', { name: /Aperçu/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Brainstorming/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Paramètres/i })).toBeInTheDocument();
    
    // Check other translated elements
    expect(screen.getByText('Détails du Projet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Modifier la Description/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Nouvelle Version/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Assistant/i })).toBeInTheDocument();
  });

  it('renders with Spanish translations', () => {
    renderComponent('es');
    
    // Check tab labels
    expect(screen.getByRole('tab', { name: /Resumen/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Lluvia de Ideas/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Configuración/i })).toBeInTheDocument();
    
    // Check other translated elements
    expect(screen.getByText('Detalles del Proyecto')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Editar Descripción/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Nueva Versión/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Asistente/i })).toBeInTheDocument();
  });
});
