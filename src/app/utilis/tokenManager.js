export async function refreshAccessToken() {
  const refreshToken = localStorage.getItem("refreshToken");
  
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }
  
  try {
    const response = await fetch("/api/User/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken })
    });
    
    if (!response.ok) {
      throw new Error("Token refresh failed");
    }
    
    const data = await response.json();
    localStorage.setItem("token", data.token);
    localStorage.setItem("refreshToken", data.refreshToken);
    
    return data.token;
  } catch (error) {
    localStorage.clear();
    window.location.href = "/";
    throw error;
  }
}

export async function makeAuthenticatedRequest(url, options = {}) {
  let token = localStorage.getItem("token");
  
  const makeRequest = async (authToken) => {
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        "Authorization": `Bearer ${authToken}`,
        "Content-Type": "application/json"
      }
    });
  };
  
  let response = await makeRequest(token);
  
  if (response.status === 401) {
    try {
      token = await refreshAccessToken();
      response = await makeRequest(token);
    } catch (error) {
      throw new Error("Authentication failed");
    }
  }
  
  return response;
}