const form = document.getElementById('formLogin');
const correoEl = document.getElementById('correo');
const passEl = document.getElementById('contrasena');
const mensajeEl = document.getElementById('mensaje');
const loginBtn = document.getElementById('loginBtn');
const correoError = document.getElementById('correo-error');
const passError = document.getElementById('contrasena-error');
const togglePass = document.getElementById('togglePassword');

function clearErrors() {
  correoError.textContent = '';
  passError.textContent = '';
  mensajeEl.textContent = '';
  mensajeEl.className = '';
}

function isValidEmail(email) {
  if (!email) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

if (togglePass) {
  togglePass.addEventListener('click', () => {
    const t = passEl.getAttribute('type') === 'password' ? 'text' : 'password';
    passEl.setAttribute('type', t);
    togglePass.innerHTML = t === 'text' ? '<i class="fa-solid fa-eye-slash"></i>' : '<i class="fa-solid fa-eye"></i>';
  });
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearErrors();

  const correo = correoEl.value && correoEl.value.trim();
  const contrasena = passEl.value || '';

  let hasError = false;
  if (!correo || !isValidEmail(correo)) {
    correoError.textContent = 'Ingresa un correo válido';
    hasError = true;
  }
  if (!contrasena || contrasena.length < 8) {
    passError.textContent = 'La contraseña debe tener al menos 8 caracteres';
    hasError = true;
  }
  if (hasError) return;

  // Disable button and show spinner
  loginBtn.disabled = true;
  loginBtn.classList.add('loading');
  const originalText = loginBtn.textContent;
  loginBtn.textContent = 'Entrando...';

  try {
    const res = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, contrasena })
    });

    const data = await res.json().catch(() => ({ success: false, message: 'Respuesta inválida del servidor' }));
    console.log('Respuesta del backend:', data);

    // detect inactive account markers in common response shapes
    const inactiveDetected = !!(data && (
      data.activo === false || data.active === false ||
      (data.estado && String(data.estado).toLowerCase().includes('inactiv')) ||
      (data.user && (data.user.activo === false || data.user.active === false))
    ));

    if (inactiveDetected) {
      mensajeEl.textContent = 'Cuenta inactiva. Comunícate al número +57 300 123 4567 para activar tu cuenta.';
      mensajeEl.className = 'error';
      return;
    }

    if (data && data.success) {
      mensajeEl.textContent = data.message || 'Inicio de sesión correcto';
      mensajeEl.className = 'success';

      // Guarda los datos del usuario en localStorage
      localStorage.setItem('userSession', JSON.stringify({
        nombre: data.nombre || data.nombre_usuario || '',
        email: data.correo || data.email || '',
        avatar: data.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.nombre || '')}`,
        telefono: data.celular || data.telefono || null,
        direccion: data.direccion || null,
        rol: data.rol || data.role || 'cliente'
      }));
      localStorage.setItem('isAdmin', (data.rol === 'admin' || data.role === 'admin') ? 'true' : 'false');

      // Short delay to show success message then redirect
      setTimeout(() => {
        if (data.rol === 'admin' || data.role === 'admin') window.location.href = '../HTML/admin.html';
        else window.location.href = '../HTML/Inicio.html';
      }, 900);
    } else {
      // Show server message as credential error
      const msg = (data && data.message) ? data.message : 'Credenciales incorrectas';
      mensajeEl.textContent = msg;
      mensajeEl.className = 'error';
    }
  } catch (error) {
    console.error('Error:', error);
    mensajeEl.textContent = 'Error de conexión. Intenta de nuevo.';
    mensajeEl.className = 'error';
  } finally {
    loginBtn.disabled = false;
    loginBtn.classList.remove('loading');
    loginBtn.textContent = originalText;
  }
});



function RecuperarPass() {
  window.location.href = '../HTML/recuperarPass.html';
}