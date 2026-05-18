import { Eye, EyeOff } from 'lucide-react';
import { useFocus } from '../context/FocusContext';

interface FocusIndicatorProps {
  variant?: 'badge' | 'dot';
  className?: string;
}

export function FocusIndicator({ variant = 'dot', className = '' }: FocusIndicatorProps) {
  const { isFocused, isDetectionEnabled } = useFocus();

  if (!isDetectionEnabled) return null;

  if (variant === 'badge') {
    return (
      <div
        className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs ${
          isFocused
            ? 'bg-focus-bg text-focus-green border border-focus-green/30'
            : 'bg-focus-amber/10 text-focus-amber border border-focus-amber/30'
        } ${className}`}
      >
        {isFocused ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
        {isFocused ? 'Focused' : 'Attention Needed'}
      </div>
    );
  }

  // Dot variant
  return (
    <div className={`relative ${className}`}>
      <div
        className={`w-2 h-2 rounded-full ${
          isFocused ? 'bg-focus-green' : 'bg-focus-amber'
        } status-pulse`}
        title={isFocused ? 'Focused' : 'Attention Needed'}
      />
    </div>
  );
}
