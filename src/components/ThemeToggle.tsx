interface ThemeToggleProps {
  theme: 'light' | 'dark';
  onToggle: () => void;
  isSpecialPage?: boolean;
}

export function ThemeToggle({ theme: _theme, onToggle: _onToggle, isSpecialPage: _isSpecialPage = false }: ThemeToggleProps) {
  return (
   <></>
  );
}
