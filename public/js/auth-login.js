const form = document.getElementById('login-form');
const errorEl = document.getElementById('login-error');
const btn = document.getElementById('login-btn');
const noteEl = document.getElementById('redirect-note');

const msg = sessionStorage.getItem('void_redirect_msg');
if (msg) {
  noteEl.textContent = `// ${msg}`;
  sessionStorage.removeItem('void_redirect_msg');
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorEl.textContent = '';
  btn.disabled = true;
  btn.textContent = 'Authenticating...';
  try {
    await api('/auth/login', {
      method: 'POST',
      body: {
        email: document.getElementById('email').value,
        password: document.getElementById('password').value
      }
    });
    CURRENT_USER = undefined;
    const redirect = sessionStorage.getItem('void_redirect_after_login');
    sessionStorage.removeItem('void_redirect_after_login');
    window.location.href = redirect || '/index.html';
  } catch (err) {
    errorEl.textContent = err.message || 'Login failed';
    btn.disabled = false;
    btn.textContent = 'Authenticate';
  }
});
