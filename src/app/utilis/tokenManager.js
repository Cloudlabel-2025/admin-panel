let refreshTimer = null;

export const setupTokenRefresh = () => {
  // Clear any existing timer
  if (refreshTimer) {
    clearTimeout(refreshTimer);
  }

  const token = localStorage.getItem('token');
  const refreshToken = localStorage.getItem('refreshToken');
  
  if (!token || !refreshToken) {
    return;
  }

  // Decode token to get expiry (without verification)
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiresAt = payload.exp * 1000; // Convert to milliseconds
    const now = Date.now();
    const timeUntilExpiry = expiresAt - now;
    
    // Refresh 5 minutes before expiry
    const refreshTime = timeUntilExpiry - (5 * 60 * 1000);
    
    if (refreshTime > 0) {
      refreshTimer = setTimeout(async () => {
        await refreshAccessToken();
      }, refreshTime);
    } else {
      // Token already expired or about to expire, refresh immediately
      refreshAccessToken();
    }
  } catch (error) {
    console.error('Error setting up token refresh:', error);
  }
};

export const refreshAccessToken = async () => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      handleTokenExpiry();
      return;
    }

    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('token', data.token);
      
      // Setup next refresh
      setupTokenRefresh();
    } else {
      handleTokenExpiry();
    }
  } catch (error) {
    console.error('Token refresh failed:', error);
    handleTokenExpiry();
  }
};

export const handleTokenExpiry = () => {
  localStorage.clear();
  window.location.href = '/';
};

export const resetActivityTimer = () => {
  // Reset the refresh timer on user activity
  setupTokenRefresh();
};

// Setup activity listeners
if (typeof window !== 'undefined') {
  const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
  let activityTimeout = null;

  const handleActivity = () => {
    // Debounce activity events
    if (activityTimeout) {
      clearTimeout(activityTimeout);
    }
    
    activityTimeout = setTimeout(() => {
      resetActivityTimer();
    }, 1000); // Debounce for 1 second
  };

  events.forEach(event => {
    window.addEventListener(event, handleActivity, { passive: true });
  });
}
