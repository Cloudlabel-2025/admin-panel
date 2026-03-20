/**
 * Drop-in replacement for fetch() that automatically refreshes the JWT
 * access token on 401 and retries the original request once.
 * If the refresh token is also expired, clears storage and redirects to login.
 */
export async function apiFetch(url, options = {}) {
  const token = localStorage.getItem("token");

  const withAuth = (opts, t) => ({
    ...opts,
    headers: {
      ...(opts.headers || {}),
      Authorization: `Bearer ${t}`,
    },
  });

  let res = await fetch(url, withAuth(options, token));

  if (res.status !== 401) return res;

  // --- Token expired: attempt refresh ---
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) {
    redirectToLogin();
    return res;
  }

  try {
    const refreshRes = await fetch("/api/User/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!refreshRes.ok) {
      redirectToLogin();
      return res;
    }

    const { token: newToken, refreshToken: newRefresh } = await refreshRes.json();
    localStorage.setItem("token", newToken);
    localStorage.setItem("refreshToken", newRefresh);

    // Retry original request with new token
    res = await fetch(url, withAuth(options, newToken));
  } catch {
    redirectToLogin();
  }

  return res;
}

function redirectToLogin() {
  localStorage.clear();
  window.location.href = "/";
}
