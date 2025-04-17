import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material';

import { I18nProvider, useI18n } from '../../../contexts/I18nContext';
import { LanguageSelector } from '../../../components/I18n/LanguageSelector';

// Wrapper component to access the I18n context
const LanguageSelectorWrapper = (props: any) => {
  const { locale } = useI18n();

  return (
    <div>
      <div data-testid="current-locale">{locale}</div>
      <LanguageSelector {...props} />
    </div>
  );
};

describe('LanguageSelector', () => {
  const theme = createTheme();

  const renderWithProviders = (props = {}) => {
    return render(
      <ThemeProvider theme={theme}>
        <I18nProvider initialLocale="en">
          <LanguageSelectorWrapper {...props} />
        </I18nProvider>
      </ThemeProvider>
    );
  };

  it('renders the icon variant by default', () => {
    renderWithProviders();

    // Check that the language icon button is rendered
    const iconButton = screen.getByLabelText(/change language/i);
    expect(iconButton).toBeInTheDocument();
  });

  it('opens the menu when icon is clicked', async () => {
    renderWithProviders();

    // Click the language icon button
    const iconButton = screen.getByLabelText(/change language/i);
    fireEvent.click(iconButton);

    // Check that the menu is open
    const englishOption = screen.getByText('English');
    expect(englishOption).toBeInTheDocument();

    // Check that other languages are also in the menu
    expect(screen.getByText('German')).toBeInTheDocument();
    expect(screen.getByText('French')).toBeInTheDocument();
    expect(screen.getByText('Spanish')).toBeInTheDocument();
  });

  it('changes the language when a language is selected from the menu', async () => {
    renderWithProviders();

    // Check initial locale
    expect(screen.getByTestId('current-locale')).toHaveTextContent('en');

    // Click the language icon button to open the menu
    const iconButton = screen.getByLabelText(/change language/i);
    fireEvent.click(iconButton);

    // Click the German option
    const germanOption = screen.getByText('German');
    fireEvent.click(germanOption);

    // Check that the locale has changed to German
    expect(screen.getByTestId('current-locale')).toHaveTextContent('de');
  });

  it('renders the select variant when specified', () => {
    renderWithProviders({ variant: 'select' });

    // Check that the select component is rendered
    const selectElement = screen.getByLabelText(/select language/i);
    expect(selectElement).toBeInTheDocument();
  });

  it('renders the dialog variant when specified', () => {
    renderWithProviders({ variant: 'dialog' });

    // Check that the dialog button is rendered
    const dialogButton = screen.getByLabelText(/change language/i);
    expect(dialogButton).toBeInTheDocument();

    // Click the button to open the dialog
    fireEvent.click(dialogButton);

    // Check that the dialog is open
    const dialogTitle = screen.getByText(/select language/i);
    expect(dialogTitle).toBeInTheDocument();

    // Check that the search input is rendered
    const searchInput = screen.getByPlaceholderText(/search languages/i);
    expect(searchInput).toBeInTheDocument();
  });

  it('filters languages in dialog when search is used', async () => {
    renderWithProviders({ variant: 'dialog' });

    // Click the button to open the dialog
    const dialogButton = screen.getByLabelText(/change language/i);
    fireEvent.click(dialogButton);

    // Type in the search input
    const searchInput = screen.getByPlaceholderText(/search languages/i);
    fireEvent.change(searchInput, { target: { value: 'ger' } });

    // Check that German is still visible
    expect(screen.getByText('German')).toBeInTheDocument();

    // Check that French is no longer visible
    expect(screen.queryByText('French')).not.toBeInTheDocument();
  });

  it('shows native names when showNativeNames is true', () => {
    renderWithProviders({ showNativeNames: true });

    // Click the language icon button to open the menu
    const iconButton = screen.getByLabelText(/change language/i);
    fireEvent.click(iconButton);

    // Check that the menu is open
    const menuElement = screen.getByRole('menu');
    expect(menuElement).toBeInTheDocument();

    // Check that German is in the document with its native name
    const menuItems = screen.getAllByRole('menuitem');
    const menuTexts = menuItems.map(item => item.textContent);

    // Check that native names are included in the menu items
    expect(menuTexts.some(text => text?.includes('Deutsch'))).toBe(true);
    expect(menuTexts.some(text => text?.includes('Français'))).toBe(true);
    expect(menuTexts.some(text => text?.includes('Español'))).toBe(true);
  });

  it('hides native names when showNativeNames is false', () => {
    renderWithProviders({ showNativeNames: false });

    // Click the language icon button to open the menu
    const iconButton = screen.getByLabelText(/change language/i);
    fireEvent.click(iconButton);

    // Check that the menu is open
    const menuElement = screen.getByRole('menu');
    expect(menuElement).toBeInTheDocument();

    // Get all menu items
    const menuItems = screen.getAllByRole('menuitem');
    const menuTexts = menuItems.map(item => item.textContent);

    // Check that native names are not included in the menu items
    expect(menuTexts.every(text => !text?.includes('Deutsch'))).toBe(true);
    expect(menuTexts.every(text => !text?.includes('Français'))).toBe(true);
    expect(menuTexts.every(text => !text?.includes('Español'))).toBe(true);
  });
});
