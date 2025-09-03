import { render, screen, fireEvent } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { MemoryRouter } from 'react-router-dom';
import { SettingsPage } from './SettingsPage';

const mockChangeLanguage = vi.fn();

vi.mock('react-i18next', async () => {
  const actual = await vi.importActual('react-i18next');
  return {
    ...(actual as any),
    useTranslation: () => ({
      t: (str: string) => str,
      i18n: {
        changeLanguage: mockChangeLanguage,
        language: 'en',
      },
    }),
  };
});

describe('SettingsPage', () => {
  it('should call changeLanguage with "ar" when the switch is toggled', () => {
    render(
      <MantineProvider>
        <MemoryRouter>
          <SettingsPage />
        </MemoryRouter>
      </MantineProvider>
    );

    // There are two switches, the first one is for the theme
    const languageSwitch = screen.getAllByRole('switch')[1];
    fireEvent.click(languageSwitch);

    expect(mockChangeLanguage).toHaveBeenCalledWith('ar');
  });
});
