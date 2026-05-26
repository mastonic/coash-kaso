'use client';

import { useState, useEffect } from 'react';

interface UseAccessState {
  isAuthenticated: boolean;
  userEmail: string;
  isLoading: boolean;
}

export function useAccess() {
  const [state, setState] = useState<UseAccessState>({
    isAuthenticated: false,
    userEmail: '',
    isLoading: true,
  });

  useEffect(() => {
    const email = localStorage.getItem('mastro_user');

    if (!email) {
      setState({
        isAuthenticated: false,
        userEmail: '',
        isLoading: false,
      });
      return;
    }

    // Verify access with server
    fetch('/api/check-access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
      .then(r => r.json())
      .then(data => {
        setState({
          isAuthenticated: data.hasAccess || false,
          userEmail: email,
          isLoading: false,
        });
      })
      .catch(err => {
        console.error('Error checking access:', err);
        setState({
          isAuthenticated: false,
          userEmail: '',
          isLoading: false,
        });
      });
  }, []);

  return state;
}
