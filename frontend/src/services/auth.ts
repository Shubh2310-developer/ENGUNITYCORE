const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Ensure API_URL ends with /api/v1 if it's just the base domain
const getBaseUrl = () => {
  let url = API_URL;
  if (!url.includes('/api/v1')) {
    url = url.endsWith('/') ? `${url}api/v1` : `${url}/api/v1`;
  }
  return url;
};

const FINAL_API_URL = getBaseUrl();

// Log API URL in development for debugging
if (process.env.NODE_ENV === 'development') {
  console.log('[Auth Service] API URL:', FINAL_API_URL);
}

export const authService = {
  async login(email: string, password: string) {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    try {
      const response = await fetch(`${FINAL_API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Authentication failed');
      }

      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error(`Unable to connect to backend at ${FINAL_API_URL}. Please ensure the backend server is running.`);
      }
      throw error;
    }
  },

  async register(email: string, password: string, role: string = 'user', firstName?: string, lastName?: string) {
    try {
      const response = await fetch(`${FINAL_API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, role, first_name: firstName, last_name: lastName }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Registration failed');
      }

      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error(`Unable to connect to backend at ${FINAL_API_URL}. Please ensure the backend server is running.`);
      }
      throw error;
    }
  },

  async getMe(token: string) {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Auth Service] Fetching user data with token present:', !!token);
      }
      const response = await fetch(`${FINAL_API_URL}/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (process.env.NODE_ENV === 'development') {
        console.log('[Auth Service] Response status:', response.status);
      }

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 401 || response.status === 403) {
          throw new Error('UNAUTHORIZED');
        }
        if (process.env.NODE_ENV === 'development') {
          console.error('[Auth Service] Error response:', errorText);
        }
        throw new Error(`Failed to fetch user data: ${response.status} ${errorText}`);
      }

      const userData = await response.json();
      if (process.env.NODE_ENV === 'development') {
        console.log('[Auth Service] User data received:', userData);
      }
      return userData;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[Auth Service] Error in getMe:', error);
      }
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error(`Unable to connect to backend at ${FINAL_API_URL}. Please ensure the backend server is running.`);
      }
      throw error;
    }
  },

  async loginWithGithub() {
    const { supabase } = await import('@/lib/supabase');
    const callbackUrl = process.env.NEXT_PUBLIC_SUPABASE_AUTH_CALLBACK_URL || `${window.location.origin}/callback`;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: callbackUrl,
        scopes: 'repo read:user'
      }
    });

    if (error) {
      throw new Error(error.message || 'GitHub OAuth failed');
    }

    // The signInWithOAuth method will automatically redirect the user
    // No need to manually redirect
  }
};
