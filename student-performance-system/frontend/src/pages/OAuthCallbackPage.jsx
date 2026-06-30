import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../context/AuthContext';

/**
 * OAuthCallbackPage (Quick Win #3)
 * 
 * The backend redirects here after a successful Google OAuth flow with:
 *   ?token=<jwt>&role=<role>
 * 
 * This page stores the token, fetches the user profile, and forwards
 * the user to their role-based dashboard.
 */
const OAuthCallbackPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const processOAuth = async () => {
      const token = searchParams.get('token');
      const role = searchParams.get('role');
      const error = searchParams.get('error');

      if (error || !token) {
        navigate('/login?error=oauth_failed', { replace: true });
        return;
      }

      try {
        // Store token in localStorage
        localStorage.setItem('token', token);

        // Fetch current user using the received token
        const res = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data?.success) {
          const userRole = res.data.user?.role || role || 'student';
          navigate(`/${userRole}`, { replace: true });
        } else {
          navigate('/login?error=profile_fetch_failed', { replace: true });
        }
      } catch (err) {
        console.error('OAuth callback error:', err.message);
        navigate('/login?error=oauth_failed', { replace: true });
      }
    };

    processOAuth();
  }, []);

  return (
    <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900 flex-col space-y-4">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
        Completing Google sign-in…
      </p>
    </div>
  );
};

export default OAuthCallbackPage;
