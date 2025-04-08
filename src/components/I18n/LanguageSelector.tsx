import {
  Language as LanguageIcon,
  Check as CheckIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputBase,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
  useTheme,
  styled,
} from '@mui/material';
import React, { useState } from 'react';

import { useI18n } from '../../contexts/I18nContext';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag?: string;
}

// Styled search input
const SearchInput = styled(InputBase)(({ theme }) => ({
  width: '100%',
  '& .MuiInputBase-input': {
    padding: '8px 8px 8px 36px',
    borderRadius: '4px',
    border: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    fontSize: '16px',
    transition: theme.transitions.create(['border-color', 'box-shadow']),
    '&:focus': {
      borderColor: theme.palette.primary.main,
      boxShadow: `0 0 0 1px ${theme.palette.primary.main}`,
    },
  },
}));

// List of supported languages
const languages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
];

interface LanguageSelectorProps {
  variant?: 'icon' | 'menu' | 'dialog';
  size?: 'small' | 'medium' | 'large';
  showFlags?: boolean;
  showNativeNames?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'icon',
  size = 'medium',
  showFlags = true,
  showNativeNames = true,
}) => {
  const theme = useTheme();
  const { locale, setLocale, t } = useI18n();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleIconClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (variant === 'icon') {
      setAnchorEl(event.currentTarget);
    } else if (variant === 'dialog') {
      setDialogOpen(true);
    }
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSearchQuery('');
  };

  const handleLanguageSelect = (code: string) => {
    setLocale(code);
    handleMenuClose();
    handleDialogClose();
  };

  // Get current language
  const currentLanguage = languages.find(lang => lang.code === locale) || languages[0];

  // Filter languages based on search query
  const filteredLanguages = languages.filter(
    lang =>
      lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Icon button for language selection
  const languageButton = (
    <Tooltip title={t('language.change') || 'Change language'}>
      <IconButton
        onClick={handleIconClick}
        size={size}
        aria-label={t('language.change') || 'Change language'}
        aria-controls={anchorEl ? 'language-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={anchorEl ? 'true' : undefined}
      >
        <LanguageIcon />
      </IconButton>
    </Tooltip>
  );

  // Menu for language selection
  const languageMenu = (
    <Menu
      id="language-menu"
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={handleMenuClose}
      MenuListProps={{
        'aria-labelledby': 'language-button',
        dense: size === 'small',
      }}
    >
      {languages.map(lang => (
        <MenuItem
          key={lang.code}
          onClick={() => handleLanguageSelect(lang.code)}
          selected={lang.code === locale}
        >
          {showFlags && lang.flag && <ListItemIcon sx={{ minWidth: 36 }}>{lang.flag}</ListItemIcon>}
          <ListItemText
            primary={
              <>
                {lang.name}
                {showNativeNames && lang.name !== lang.nativeName && (
                  <Typography
                    component="span"
                    variant="body2"
                    color="text.secondary"
                    sx={{ ml: 1 }}
                  >
                    ({lang.nativeName})
                  </Typography>
                )}
              </>
            }
          />
          {lang.code === locale && <CheckIcon fontSize="small" color="primary" />}
        </MenuItem>
      ))}
    </Menu>
  );

  // Dialog for language selection
  const languageDialog = (
    <Dialog
      open={dialogOpen}
      onClose={handleDialogClose}
      maxWidth="xs"
      fullWidth
      aria-labelledby="language-dialog-title"
    >
      <DialogTitle id="language-dialog-title">
        {t('language.select') || 'Select Language'}
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ mb: 2, position: 'relative' }}>
          <SearchIcon
            sx={{
              position: 'absolute',
              left: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'action.active',
            }}
          />
          <SearchInput
            fullWidth
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t('language.search') || 'Search languages'}
          />
        </Box>

        <List sx={{ pt: 0 }}>
          {filteredLanguages.map(lang => (
            <ListItem key={lang.code} disablePadding>
              <ListItemButton
                onClick={() => handleLanguageSelect(lang.code)}
                selected={lang.code === locale}
              >
                {showFlags && lang.flag && (
                  <ListItemIcon sx={{ minWidth: 36 }}>{lang.flag}</ListItemIcon>
                )}
                <ListItemText
                  primary={lang.name}
                  secondary={
                    showNativeNames && lang.name !== lang.nativeName ? lang.nativeName : undefined
                  }
                />
                {lang.code === locale && <CheckIcon color="primary" />}
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleDialogClose} color="primary">
          {t('common.close') || 'Close'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  // Render based on variant
  return (
    <>
      {languageButton}
      {variant === 'icon' && languageMenu}
      {variant === 'dialog' && languageDialog}
    </>
  );
};

export default LanguageSelector;
