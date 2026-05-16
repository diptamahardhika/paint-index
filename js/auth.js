const AUTH_STORAGE_KEY = "paint-index.auth.user";

const authState = {
  user: null,
};

function $(selector) {
  return document.querySelector(selector);
}

function loadCachedUser() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveCachedUser(user) {
  if (!user) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
}

function renderAuthState() {
  const banner = $("#inventory-auth-banner");
  const userPanel = $("#inventory-auth-user");

  if (!banner || !userPanel) {
    return;
  }

  if (authState.user) {
    banner.hidden = true;
    userPanel.hidden = false;

    $("#auth-user-name").textContent =
      authState.user.displayName || "Authenticated User";

    $("#auth-user-email").textContent =
      authState.user.email || "Cloud inventory enabled";

    return;
  }

  banner.hidden = false;
  userPanel.hidden = true;
}

function simulateGoogleLogin() {
  const confirmed = window.confirm(
    "Signing in will replace your current local inventory with your Google account inventory. Export your inventory first if needed."
  );

  if (!confirmed) {
    return;
  }

  const user = {
    uid: "temporary-dev-user",
    displayName: "Google User",
    email: "google-auth-placeholder@example.com",
  };

  authState.user = user;
  saveCachedUser(user);
  renderAuthState();

  window.dispatchEvent(
    new CustomEvent("paint-index-auth-changed", {
      detail: {
        user,
      },
    })
  );
}

function logout() {
  authState.user = null;
  saveCachedUser(null);
  renderAuthState();

  window.dispatchEvent(
    new CustomEvent("paint-index-auth-changed", {
      detail: {
        user: null,
      },
    })
  );
}

function bindAuth() {
  $("#google-login-button")?.addEventListener(
    "click",
    simulateGoogleLogin
  );

  $("#google-logout-button")?.addEventListener("click", logout);
}

function initAuth() {
  authState.user = loadCachedUser();
  bindAuth();
  renderAuthState();
}

initAuth();