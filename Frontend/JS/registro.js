document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formRegistro');
  const nombreEl = document.getElementById('nombre');
  const correoEl = document.getElementById('correo');
  const contrasenaEl = document.getElementById('contrasena');
  const celularEl = document.getElementById('celular');
  const direccionEl = document.getElementById('direccion');
  const mensaje = document.getElementById('mensaje');

  const errors = {
    nombre: document.getElementById('nombre-error'),
    correo: document.getElementById('correo-error'),
    contrasena: document.getElementById('contrasena-error'),
    celular: document.getElementById('celular-error'),
    direccion: document.getElementById('direccion-error')
  };

  function clearErrors() {
    mensaje.textContent = '';
    mensaje.className = '';
    Object.values(errors).forEach(el => { if (el) el.textContent = ''; });
    [nombreEl, correoEl, contrasenaEl, celularEl, direccionEl].forEach(i => i.classList.remove('invalid'));
  }

  function isValidEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  function isNumeric(v) {
    return /^\d+$/.test(v.replace(/\s+/g, ''));
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    let valid = true;
    const nombre = nombreEl.value.trim();
    const correo = correoEl.value.trim();
    const contrasena = contrasenaEl.value;
    const celular = celularEl.value.trim();
    const direccion = direccionEl.value.trim();

    if (!nombre) {
      errors.nombre.textContent = 'El nombre es obligatorio.';
      nombreEl.classList.add('invalid');
      valid = false;
    }

    if (!correo) {
      errors.correo.textContent = 'El correo es obligatorio.';
      correoEl.classList.add('invalid');
      valid = false;
    } else if (!isValidEmail(correo)) {
      errors.correo.textContent = 'Introduce un correo válido.';
      correoEl.classList.add('invalid');
      valid = false;
    }

    if (!contrasena) {
      errors.contrasena.textContent = 'La contraseña es obligatoria.';
      contrasenaEl.classList.add('invalid');
      valid = false;
    } else if (contrasena.length < 8) {
      errors.contrasena.textContent = 'La contraseña debe tener al menos 8 caracteres.';
      contrasenaEl.classList.add('invalid');
      valid = false;
    }

    if (!celular) {
      errors.celular.textContent = 'El número de celular es obligatorio.';
      celularEl.classList.add('invalid');
      valid = false;
    } else if (!isNumeric(celular) || celular.length < 7) {
      errors.celular.textContent = 'Introduce un número de celular válido (solo dígitos).';
      celularEl.classList.add('invalid');
      valid = false;
    }

    if (!direccion) {
      errors.direccion.textContent = 'La dirección es obligatoria.';
      direccionEl.classList.add('invalid');
      valid = false;
    }

    if (!valid) {
      mensaje.textContent = 'Por favor corrige los errores del formulario.';
      mensaje.classList.add('error');
      return;
    }

    try {
      const res = await fetch('/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, correo, contrasena, celular, direccion })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        mensaje.textContent = data.mensaje || 'Registro exitoso';
        mensaje.className = 'success';
        setTimeout(() => {
          window.location.href = '../HTML/login.html';
        }, 1200);
      } else {
        mensaje.textContent = data.mensaje || 'Ocurrió un error en el registro';
        mensaje.className = 'error';
      }
    } catch (error) {
      console.error('Error:', error);
      mensaje.textContent = 'Error de conexión con el servidor';
      mensaje.className = 'error';
    }
  });

  // Limpiar errores al escribir
  [nombreEl, correoEl, contrasenaEl, celularEl, direccionEl].forEach((input) => {
    input.addEventListener('input', () => {
      const err = document.getElementById(input.id + '-error');
      if (err) err.textContent = '';
      input.classList.remove('invalid');
      mensaje.textContent = '';
      mensaje.className = '';
    });
  });
});
