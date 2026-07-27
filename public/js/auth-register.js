const form = document.getElementById('register-form');
const errorEl = document.getElementById('register-error');
const btn = document.getElementById('register-btn');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorEl.textContent = '';
  btn.disabled = true;
  btn.textContent = 'Creating...';
  try {
    await api('/auth/register', {
      method: 'POST',
      body: {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value
      }
    });
    CURRENT_USER = undefined;
    window.location.href = '/index.html';
  } catch (err) {
    errorEl.textContent = err.message || 'Registration failed';
    btn.disabled = false;
    btn.textContent = 'Create account';
  }
});
