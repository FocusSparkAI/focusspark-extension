interface ThemeToggleProps {
  theme: 'light' | 'dark';
  onToggle: () => void;
  isSpecialPage?: boolean;
}

export function ThemeToggle({ theme, onToggle, isSpecialPage = false }: ThemeToggleProps) {
  void theme;
  void onToggle;
  void isSpecialPage;

  return null;
}
