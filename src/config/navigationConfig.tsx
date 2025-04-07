import {
  Dashboard as DashboardIcon,
  History as HistoryIcon,
  Storage as ProjectsIcon,
  Settings as SettingsIcon,
  Chat as ChatIcon,
  CloudUpload as BackupIcon,
  Add as AddIcon,
  FileUpload as ImportIcon,
  ViewList as ViewListIcon,
  List as TemplatesIcon,
  Bookmark as PinnedIcon,
  AccessTime as RecentIcon,
  Share as SharedIcon,
  Category as CategoriesIcon,
  LocalOffer as TagsIcon,
  Archive as ArchiveIcon,
  Code as CodeEditorIcon,
  Terminal as TerminalIcon,
  Build as BuildToolsIcon,
  Collections as AssetLibraryIcon,
  Description as DocumentationIcon,
  ContentCut as SnippetsIcon,
  Palette as ThemeIcon,
  Keyboard as KeyboardIcon,
  Notifications as NotificationsIcon,
  Api as ApiIcon,
  Storage as StorageIcon,
  Speed as MonitorIcon,
  Memory as CacheIcon,
  BugReport as DebugIcon,
  Psychology as BrainstormIcon,
} from '@mui/icons-material';

import type { NavigationItem } from '../types/navigation';

export const navigationItems: NavigationItem[] = [
  {
    id: 'project-hub',
    type: 'section',
    label: 'Project Hub',
    icon: <DashboardIcon />,
    accessLevel: 'basic',
    children: [
      {
        id: 'quick-actions',
        type: 'section',
        label: 'Quick Actions',
        icon: <AddIcon />,
        accessLevel: 'basic',
        children: [
          {
            id: 'new-project',
            type: 'link',
            label: 'New Project',
            icon: <AddIcon />,
            path: '/projects/new',
            accessLevel: 'basic',
          },
          {
            id: 'import-project',
            type: 'action',
            label: 'Import Project',
            icon: <ImportIcon />,
            accessLevel: 'basic',
          },
          {
            id: 'browse-templates',
            type: 'link',
            label: 'Browse Templates',
            icon: <TemplatesIcon />,
            path: '/projects/templates',
            accessLevel: 'basic',
          },
        ],
      },
      {
        id: 'recent-projects',
        type: 'section',
        label: 'Recent Projects',
        icon: <RecentIcon />,
        accessLevel: 'basic',
        children: [
          {
            id: 'pinned-projects',
            type: 'link',
            label: 'Pinned Projects',
            icon: <PinnedIcon />,
            path: '/projects/pinned',
            accessLevel: 'basic',
          },
          {
            id: 'last-accessed',
            type: 'link',
            label: 'Last Accessed',
            icon: <RecentIcon />,
            path: '/projects/recent',
            accessLevel: 'basic',
          },
          {
            id: 'shared-with-me',
            type: 'link',
            label: 'Shared With Me',
            icon: <SharedIcon />,
            path: '/projects/shared',
            accessLevel: 'basic',
          },
        ],
      },
      {
        id: 'project-collections',
        type: 'section',
        label: 'Project Collections',
        icon: <CategoriesIcon />,
        accessLevel: 'basic',
        children: [
          {
            id: 'custom-categories',
            type: 'link',
            label: 'Custom Categories',
            icon: <CategoriesIcon />,
            path: '/projects/categories',
            accessLevel: 'basic',
          },
          {
            id: 'tags-view',
            type: 'link',
            label: 'Tags View',
            icon: <TagsIcon />,
            path: '/projects/tags',
            accessLevel: 'basic',
          },
          {
            id: 'archive',
            type: 'link',
            label: 'Archive',
            icon: <ArchiveIcon />,
            path: '/projects/archive',
            accessLevel: 'basic',
          },
        ],
      },
    ],
  },
  {
    id: 'workspace-tools',
    type: 'section',
    label: 'Workspace Tools',
    icon: <BuildToolsIcon />,
    accessLevel: 'basic',
    children: [
      {
        id: 'projects',
        type: 'section',
        label: 'Projects',
        icon: <ProjectsIcon />,
        accessLevel: 'basic',
        children: [
          {
            id: 'all-projects',
            type: 'link',
            label: 'All Projects',
            icon: <ViewListIcon />,
            path: '/projects',
            accessLevel: 'basic',
          },
          {
            id: 'project-templates',
            type: 'link',
            label: 'Project Templates',
            icon: <TemplatesIcon />,
            path: '/projects/templates',
            accessLevel: 'basic',
          },
          {
            id: 'sync-status',
            type: 'link',
            label: 'Sync Status',
            icon: <BackupIcon />,
            path: '/projects/sync',
            accessLevel: 'basic',
          },
        ],
      },
      {
        id: 'project-tools',
        type: 'section',
        label: 'Project Tools',
        icon: <BrainstormIcon />,
        accessLevel: 'basic',
        children: [
          {
            id: 'software-template',
            type: 'link',
            label: 'Software Development',
            icon: <CodeEditorIcon />,
            path: '/templates/software',
            accessLevel: 'basic',
          },
          {
            id: 'marketing-template',
            type: 'link',
            label: 'Marketing Campaign',
            icon: <ViewListIcon />,
            path: '/templates/marketing',
            accessLevel: 'basic',
          },
          {
            id: 'research-template',
            type: 'link',
            label: 'Research Project',
            icon: <DocumentationIcon />,
            path: '/templates/research',
            accessLevel: 'basic',
          },
          {
            id: 'business-template',
            type: 'link',
            label: 'Business Plan',
            icon: <BuildToolsIcon />,
            path: '/templates/business',
            accessLevel: 'basic',
          },
        ],
      },
      {
        id: 'resources',
        type: 'section',
        label: 'Resources',
        icon: <AssetLibraryIcon />,
        accessLevel: 'basic',
        children: [
          {
            id: 'asset-library',
            type: 'link',
            label: 'Asset Library',
            icon: <AssetLibraryIcon />,
            path: '/resources/assets',
            accessLevel: 'basic',
          },
          {
            id: 'documentation',
            type: 'link',
            label: 'Documentation',
            icon: <DocumentationIcon />,
            path: '/resources/docs',
            accessLevel: 'basic',
          },
          {
            id: 'snippets',
            type: 'link',
            label: 'Snippets',
            icon: <SnippetsIcon />,
            path: '/resources/snippets',
            accessLevel: 'basic',
          },
        ],
      },
    ],
  },
  {
    id: 'system-controls',
    type: 'section',
    label: 'System Controls',
    icon: <SettingsIcon />,
    accessLevel: 'basic',
    children: [
      {
        id: 'user-settings',
        type: 'section',
        label: 'User Settings',
        icon: <SettingsIcon />,
        accessLevel: 'basic',
        children: [
          {
            id: 'theme-display',
            type: 'link',
            label: 'Theme & Display',
            icon: <ThemeIcon />,
            path: '/settings/theme',
            accessLevel: 'basic',
          },
          {
            id: 'keyboard-shortcuts',
            type: 'link',
            label: 'Keyboard Shortcuts',
            icon: <KeyboardIcon />,
            path: '/settings/shortcuts',
            accessLevel: 'basic',
          },
          {
            id: 'notifications',
            type: 'link',
            label: 'Notifications',
            icon: <NotificationsIcon />,
            path: '/settings/notifications',
            accessLevel: 'basic',
          },
        ],
      },
      {
        id: 'integration-hub',
        type: 'section',
        label: 'Integration Hub',
        icon: <ApiIcon />,
        accessLevel: 'basic',
        children: [
          {
            id: 's3-sync-settings',
            type: 'link',
            label: 'S3 Sync Settings',
            icon: <BackupIcon />,
            path: '/settings/s3-sync',
            accessLevel: 'basic',
          },
          {
            id: 'api-configuration',
            type: 'link',
            label: 'API Configuration',
            icon: <ApiIcon />,
            path: '/settings/api',
            accessLevel: 'basic',
          },
          {
            id: 'storage-settings',
            type: 'link',
            label: 'Storage Settings',
            icon: <StorageIcon />,
            path: '/settings/storage',
            accessLevel: 'basic',
          },
        ],
      },
      {
        id: 'performance',
        type: 'section',
        label: 'Performance',
        icon: <MonitorIcon />,
        accessLevel: 'admin',
        children: [
          {
            id: 'system-monitor',
            type: 'link',
            label: 'System Monitor',
            icon: <MonitorIcon />,
            path: '/settings/monitor',
            accessLevel: 'admin',
          },
          {
            id: 'cache-control',
            type: 'link',
            label: 'Cache Control',
            icon: <CacheIcon />,
            path: '/settings/cache',
            accessLevel: 'admin',
          },
          {
            id: 'debug-console',
            type: 'link',
            label: 'Debug Console',
            icon: <DebugIcon />,
            path: '/settings/debug',
            accessLevel: 'admin',
          },
        ],
      },
    ],
  },
  {
    id: 'history',
    type: 'link',
    label: 'History',
    icon: <HistoryIcon />,
    path: '/history',
    accessLevel: 'basic',
  },
  {
    id: 'chat-assistant',
    type: 'link',
    label: 'Chat Assistant',
    icon: <ChatIcon />,
    path: '/chat',
    accessLevel: 'basic',
  },
];
