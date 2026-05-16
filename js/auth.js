import {
  loginWithGoogle,
  logoutUser,
  subscribeToAuth,
} from './firebase/auth.js';

const authState = {
  user: null,
};

function $(selector) {
  return document.querySelector(selector);
}

function renderAuthState() {
  const banner = $('#inventory-auth-banner');
  const userPanel = $('#inventory-auth-user');

  if (!banner || !userPanel) {
    return;
  }

  if (authState.user) {
    banner.hidden = true;
    userPanel.hidden = false;

    $('#auth-user-name').textContent =
      authState.user.displayName || 'Authenticated User';

    $('#auth-user-email').textContent =
      authState.user.email || 'Cloud inventory enabled';

    return;
  }

  banner.hidden = false;
  userPanel.hidden = true;
}

async function handleGoogleLogin() {
  try {
    await loginWithGoogle();
  } catch (error) {
    console.error('Google authentication failed', error);

    window.alert(
      'Google authentication failed. Check Firebase configuration and authorized domains.'
    );
  }
}

async function handleLogout() {
  await logoutUser();
}

function dispatchAuthChanged(user) {
  window.dispatchEvent(
    new CustomEvent('paint-index-auth-changed', {
      detail: {
        user,
      },
    })
  );
}

function bindAuth() {
  $('#google-login-button')?.addEventListener(
    'click',
    handleGoogleLogin
  );

  $('#google-logout-button')?.addEventListener(
    'click',
    handleLogout
  );
}

function initAuth() {
  bindAuth();

  subscribeToAuth((user) => {
    authState.user = user;

    renderAuthState();

    dispatchAuthChanged(user);
  });
}

initAuth();
