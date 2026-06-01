import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getAccessToken } from '../utils/backendClient';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [checking, setChecking] = useState(true);
  const [hasToken, setHasToken] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const toastShownRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    getAccessToken().then((t) => {
      if (!mounted) return;
      setHasToken(!!t);
      setChecking(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (checking || hasToken) return;

    if (!toastShownRef.current) {
      toast.info('Please sign in to continue', { duration: 2000 });
      toastShownRef.current = true;
    }

    const timer = window.setTimeout(() => setRedirecting(true), 650);
    return () => window.clearTimeout(timer);
  }, [checking, hasToken]);

  if (checking) return null;

  if (!hasToken) {
    if (!redirecting) return null;

    return <Navigate to="/signin" replace />;
  }

  return <>{children}</>;
}
