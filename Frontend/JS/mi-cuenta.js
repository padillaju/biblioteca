

function loadCart() {
    fetch('http://localhost:3000/carrito', { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
            const cartItemsContainer = document.getElementById('cart-items');
            const cartSummary = document.getElementById('cart-summary');
            const clearCartBtn = document.getElementById('clear-cart-btn');
            const cartStat = document.getElementById('cart-stat');

            if (data.success && data.items.length > 0) {
                // Agrupar items por libro_id_api
                const groupedItems = {};
                data.items.forEach(item => {
                    if (!groupedItems[item.libro_id_api]) {
                        groupedItems[item.libro_id_api] = {
                            ...item,
                            cantidad: item.cantidad
                        };
                    } else {
                        groupedItems[item.libro_id_api].cantidad += item.cantidad;
                    }
                });

                let html = '';
                let subtotal = 0;
                let totalItems = 0;

                Object.values(groupedItems).forEach((item, index) => {
                    const itemTotal = item.precio_unitario * item.cantidad;
                    subtotal += itemTotal;
                    totalItems += item.cantidad;

                    html += `
                        <div class="item-card">
                            <div class="item-header">
                                <img src="${item.imagen}" alt="${item.titulo}" class="item-image">
                                <div class="item-info">
                                    <h3 class="item-title">${item.titulo}</h3>
                                    <p class="item-author">por Autor Desconocido</p>
                                    <p class="item-price">$${item.precio_unitario.toLocaleString()}</p>
                                </div>
                            </div>
                            <div class="quantity-controls">
                                <button class="quantity-btn" onclick="updateQuantity('${item.libro_id_api}', -1)">-</button>
                                <span class="quantity">${item.cantidad}</span>
                                <button class="quantity-btn" onclick="updateQuantity('${item.libro_id_api}', 1)">+</button>
                            </div>
                            <div class="item-actions">
                                <div style="font-weight: bold; color: #667eea;">Total: $${itemTotal.toLocaleString()}</div>
                                <button class="btn-danger btn-small" onclick="removeFromCart('${item.libro_id_api}')">
                                    <i class="fas fa-trash"></i> Eliminar
                                </button>
                            </div>
                        </div>
                    `;
                });

                cartItemsContainer.innerHTML = html;
                cartStat.innerText = totalItems;
                cartSummary.style.display = 'block';
                clearCartBtn.style.display = 'inline-block';
                document.getElementById('cart-subtotal').innerText = `$${subtotal.toLocaleString()}`;
                document.getElementById('cart-total').innerText = `$${subtotal.toLocaleString()}`;

            } else {
                cartItemsContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-shopping-cart"></i>
                        <h3>Tu carrito está vacío</h3>
                        <p>Explora nuestros libros y añade algunos a tu carrito</p>
                        <button class="btn-primary" onclick="goToHome()">Explorar Libros</button>
                    </div>
                `;
                cartSummary.style.display = 'none';
                clearCartBtn.style.display = 'none';
                cartStat.innerText = 0;
            }
        })
        .catch(err => console.error('Error al cargar carrito:', err));

      

}

// Compatibilidad: algunas vistas llaman a `renderCart()` — delegar a `loadCart()`
function renderCart() {
  if (typeof loadCart === 'function') {
    try { loadCart(); return; } catch (e) { console.warn('renderCart -> loadCart failed', e) }
  }
  // Si no hay `loadCart`, no hacemos nada (evita ReferenceError cuando se llama desde otras páginas)
}

// Confirmación no bloqueante usando un "toast" con botones
function confirmWithToast(message, onConfirm, onCancel) {
  // Crear contenedor
  const wrapper = document.createElement('div')
  wrapper.className = 'confirm-toast-wrapper'
  wrapper.style.position = 'fixed'
  wrapper.style.left = '50%'
  wrapper.style.bottom = '24px'
  wrapper.style.transform = 'translateX(-50%)'
  wrapper.style.zIndex = 9999
  wrapper.style.background = '#fff'
  wrapper.style.border = '1px solid rgba(0,0,0,0.08)'
  wrapper.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)'
  wrapper.style.padding = '12px 14px'
  wrapper.style.borderRadius = '10px'
  wrapper.style.display = 'flex'
  wrapper.style.alignItems = 'center'
  wrapper.style.gap = '12px'

  const msg = document.createElement('div')
  msg.textContent = message
  msg.style.color = '#222'
  msg.style.fontSize = '14px'

  const btnConfirm = document.createElement('button')
  btnConfirm.textContent = 'Confirmar'
  btnConfirm.style.background = '#6B00FF'
  btnConfirm.style.color = '#fff'
  btnConfirm.style.border = 'none'
  btnConfirm.style.padding = '8px 10px'
  btnConfirm.style.borderRadius = '8px'
  btnConfirm.style.cursor = 'pointer'

  const btnCancel = document.createElement('button')
  btnCancel.textContent = 'Cancelar'
  btnCancel.style.background = '#eee'
  btnCancel.style.color = '#333'
  btnCancel.style.border = 'none'
  btnCancel.style.padding = '8px 10px'
  btnCancel.style.borderRadius = '8px'
  btnCancel.style.cursor = 'pointer'

  wrapper.appendChild(msg)
  wrapper.appendChild(btnConfirm)
  wrapper.appendChild(btnCancel)

  document.body.appendChild(wrapper)

  const cleanup = () => { if (wrapper && wrapper.parentNode) wrapper.parentNode.removeChild(wrapper) }

  btnConfirm.addEventListener('click', () => {
    try { onConfirm && onConfirm() } catch (e) { console.error('confirmWithToast onConfirm error', e) }
    cleanup()
  })

  btnCancel.addEventListener('click', () => {
    try { onCancel && onCancel() } catch (e) { /* ignore */ }
    cleanup()
  })

  // Auto-dismiss after 10s
  const timeout = setTimeout(() => { cleanup(); if (onCancel) onCancel() }, 10000)
  // Clear timeout if user interacts (proteger contra valores nulos)
  const _interactiveBtns = [btnConfirm, btnCancel].filter(Boolean)
  _interactiveBtns.forEach(b => b.addEventListener('click', () => clearTimeout(timeout)))
}

 
function updateQuantity(libro_id_api, delta) {
  // Intentar actualizar en el servidor; si falla, hacer fallback a localStorage
  fetch('http://localhost:3000/carrito/actualizar', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ libro_id_api, delta })
  })
  .then(res => res.json().catch(() => ({ success: false })))
  .then(data => {
    if (data && data.success) {
      // servidor actualizó correctamente
      try { loadCart(); } catch (e) { /* ignore */ }
      return;
    }

    // Fallback: actualizar carrito localmente
    try {
      const cart = getCart() || [];
      const idx = cart.findIndex(item => String(item.id) === String(libro_id_api) || String(item.libro_id_api) === String(libro_id_api));
      if (idx !== -1) {
        const it = cart[idx];
        const currentQty = Number(it.quantity || it.cantidad || 0);
        const newQty = currentQty + Number(delta);
        if (newQty > 0) {
          // actualizar cantidad
          // normalizar a `quantity` para la UI local
          it.quantity = newQty;
        } else {
          // eliminar si llega a 0
          cart.splice(idx, 1);
        }
        saveCart(cart);
        try { showNotification('Cantidad actualizada', 'success') } catch (e) { /* ignore */ }
      } else {
        console.warn('Elemento no encontrado en carrito local para actualizar:', libro_id_api);
      }
    } catch (e) {
      console.warn('Fallback local updateQuantity falló:', e);
    }
  })
  .catch(err => {
    // Error de red: intentar fallback local
    try {
      const cart = getCart() || [];
      const idx = cart.findIndex(item => String(item.id) === String(libro_id_api) || String(item.libro_id_api) === String(libro_id_api));
      if (idx !== -1) {
        const it = cart[idx];
        const currentQty = Number(it.quantity || it.cantidad || 0);
        const newQty = currentQty + Number(delta);
        if (newQty > 0) it.quantity = newQty; else cart.splice(idx, 1);
        saveCart(cart);
        try { showNotification('Cantidad actualizada (local)', 'success') } catch (e) { /* ignore */ }
      }
    } catch (e) {
      console.error('updateQuantity fallback failure:', e, err);
    }
  });
}



// Llamar al cargar la página
window.addEventListener('DOMContentLoaded', loadCart);


// Llamar a loadCart al cargar la página
window.addEventListener('DOMContentLoaded', loadCart);



 function removeFromCart(libro_id_api) {
  confirmWithToast('¿Seguro que quieres eliminar este libro del carrito?', () => {
    fetch(`http://localhost:3000/carrito/${libro_id_api}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        try { showNotification('Libro eliminado del carrito', 'success') } catch (e) { console.log('Libro eliminado del carrito') }
        if (typeof loadCart === 'function') { try { loadCart() } catch (e) { /* ignore */ } }
      } else {
        try { showNotification('Error al eliminar el libro del carrito', 'warning') } catch (e) { console.error('Error al eliminar el libro del carrito') }
        console.error(data.message);
      }
    })
    .catch(err => console.error('Error en fetch removeFromCart:', err));
  }, () => {
    try { showNotification('Eliminación cancelada', 'info') } catch (e) { /* ignore */ }
  })
}



// ===== INITIALIZATION =====
document.addEventListener("DOMContentLoaded", () => {
  loadUserProfile()
  updateAllCounts()
  loadCart()
  renderFavorites()
  renderOrders()
  showTab("cart") // Show cart tab by default
})

// ===== NAVIGATION =====
function goToHome() {
  window.location.href = "Inicio.html";
}






// ===== perfil =====
function loadUserProfile() {
  const user = JSON.parse(localStorage.getItem("userSession")) || {}
  const nameEl = document.getElementById("profile-name")
  const emailEl = document.getElementById("profile-email")
  const phoneEl = document.getElementById("profile-phone")
  const addressEl = document.getElementById("profile-address")
  const avatarContainer = document.querySelector('.profile-avatar')

  if (nameEl) nameEl.textContent = user.nombre || "Usuario Invitado"
  if (emailEl) emailEl.textContent = user.email || "Inicia sesión para más funciones"
  if (phoneEl) phoneEl.textContent = user.telefono ? `Teléfono: ${user.telefono}` : ""
  if (addressEl) addressEl.textContent = user.direccion ? `Dirección: ${user.direccion}` : ""

  // Mostrar avatar si existe, si no mostrar icono por defecto
  if (avatarContainer) {
    if (user.avatar) {
      avatarContainer.innerHTML = `<img id="profile-avatar-img" src="${user.avatar}" alt="Avatar" style="width:100px;height:100px;object-fit:cover;border-radius:50%;"/>`
    } else {
      avatarContainer.innerHTML = `<i class="fas fa-user-circle"></i>`
    }
  }

  // Also update preview panel if present
  const previewName = document.getElementById('preview-name')
  const previewEmail = document.getElementById('preview-email')
  const previewPhone = document.getElementById('preview-phone')
  const previewAddress = document.getElementById('preview-address')
  const previewAvatarContainer = document.getElementById('preview-avatar-container')
  const metaName = document.getElementById('meta-name')
  const metaEmail = document.getElementById('meta-email')
  const metaPhone = document.getElementById('meta-phone')
  const metaAddress = document.getElementById('meta-address')

  if (previewName) previewName.textContent = user.nombre || 'Usuario Invitado'
  if (previewEmail) previewEmail.textContent = user.email || 'Inicia sesión para más funciones'
  if (previewPhone) previewPhone.textContent = user.telefono ? `Teléfono: ${user.telefono}` : ''
  if (previewAddress) previewAddress.textContent = user.direccion ? `Dirección: ${user.direccion}` : ''

  if (metaName) metaName.textContent = user.nombre || ''
  if (metaEmail) metaEmail.textContent = user.email || ''
  if (metaPhone) metaPhone.textContent = user.telefono || ''
  if (metaAddress) metaAddress.textContent = user.direccion || ''

  if (previewAvatarContainer) {
    if (user.avatar) {
      previewAvatarContainer.innerHTML = `<img id="preview-avatar-img" src="${user.avatar}" alt="Avatar" style="width:120px;height:120px;object-fit:cover;border-radius:50%;"/>`
    } else {
      previewAvatarContainer.innerHTML = `<i class="fas fa-user-circle" style="font-size:120px;color:#888"></i>`
    }
  }
}

function loadProfileForm() {
  const user = JSON.parse(localStorage.getItem("userSession")) || {}

  const nameInput = document.getElementById("profile-name-input")
  const emailInput = document.getElementById("profile-email-input")
  const phoneInput = document.getElementById("profile-phone-input")
  const addressInput = document.getElementById("profile-address-input")
  const photoInput = document.getElementById("profile-photo-input")
  const previewImg = document.getElementById("profile-avatar-preview")

  if (nameInput) nameInput.value = user.nombre || ""
  if (emailInput) emailInput.value = user.email || ""
  if (phoneInput) phoneInput.value = user.telefono || ""
  if (addressInput) addressInput.value = user.direccion || ""
  // Limpiar campos de contraseña por seguridad
  const currentPassword = document.getElementById('profile-current-password-input')
  const newPassword = document.getElementById('profile-new-password-input')
  if (currentPassword) currentPassword.value = ''
  if (newPassword) newPassword.value = ''

  // Clear any inline field errors
  clearFieldError('profile-current-password-input')
  clearFieldError('profile-new-password-input')

  // Mostrar previsualización si hay avatar guardado
  if (previewImg) {
    if (user.avatar) {
      previewImg.src = user.avatar
      previewImg.style.display = 'block'
    } else {
      previewImg.src = ''
      previewImg.style.display = 'none'
    }
  }

  // Limpiar el input file si existe
  if (photoInput) photoInput.value = null

  // Attach live preview listeners for form inputs
  attachProfileFormListeners()
}

function updatePreviewFromInputs() {
  const nameVal = document.getElementById('profile-name-input')?.value || ''
  const emailVal = document.getElementById('profile-email-input')?.value || ''
  const phoneVal = document.getElementById('profile-phone-input')?.value || ''
  const addressVal = document.getElementById('profile-address-input')?.value || ''
  const previewName = document.getElementById('preview-name')
  const previewEmail = document.getElementById('preview-email')
  const previewPhone = document.getElementById('preview-phone')
  const previewAddress = document.getElementById('preview-address')
  const metaName = document.getElementById('meta-name')
  const metaEmail = document.getElementById('meta-email')
  const metaPhone = document.getElementById('meta-phone')
  const metaAddress = document.getElementById('meta-address')

  if (previewName) previewName.textContent = nameVal || 'Usuario Invitado'
  if (previewEmail) previewEmail.textContent = emailVal || 'Inicia sesión para más funciones'
  if (previewPhone) previewPhone.textContent = phoneVal ? `Teléfono: ${phoneVal}` : ''
  if (previewAddress) previewAddress.textContent = addressVal ? `Dirección: ${addressVal}` : ''

  if (metaName) metaName.textContent = nameVal || ''
  if (metaEmail) metaEmail.textContent = emailVal || ''
  if (metaPhone) metaPhone.textContent = phoneVal || ''
  if (metaAddress) metaAddress.textContent = addressVal || ''
}

function attachProfileFormListeners() {
  const inputs = ['profile-name-input','profile-email-input','profile-phone-input','profile-address-input']
  inputs.forEach(id => {
    const el = document.getElementById(id)
    if (el) el.removeEventListener('input', updatePreviewFromInputs)
    if (el) el.addEventListener('input', updatePreviewFromInputs)
  })

  // Photo input already triggers preview via change listener; ensure it updates preview avatar container too
  const photoInput = document.getElementById('profile-photo-input')
  if (photoInput) {
    photoInput.removeEventListener('change', updatePreviewFromInputs)
    photoInput.addEventListener('change', () => {
      const file = photoInput.files && photoInput.files[0]
      const previewAvatarContainer = document.getElementById('preview-avatar-container')
      const previewImg = document.getElementById('profile-avatar-preview')
      if (file && previewAvatarContainer) {
        readFileAsDataURL(file).then(dataUrl => {
          // set main preview avatar container
          previewAvatarContainer.innerHTML = `<img id="preview-avatar-img" src="${dataUrl}" alt="Avatar" style="width:120px;height:120px;object-fit:cover;border-radius:50%;"/>`
          if (previewImg) { previewImg.src = dataUrl; previewImg.style.display = 'block' }
        }).catch(err => console.warn('Error reading file for preview:', err))
      } else if (previewAvatarContainer) {
        // if cleared file, restore from stored userSession
        const existing = JSON.parse(localStorage.getItem('userSession')) || {}
        if (existing.avatar) {
          previewAvatarContainer.innerHTML = `<img id="preview-avatar-img" src="${existing.avatar}" alt="Avatar" style="width:120px;height:120px;object-fit:cover;border-radius:50%;"/>`
          if (previewImg) { previewImg.src = existing.avatar; previewImg.style.display = 'block' }
        } else {
          previewAvatarContainer.innerHTML = `<i class="fas fa-user-circle" style="font-size:120px;color:#888"></i>`
          if (previewImg) { previewImg.src = ''; previewImg.style.display = 'none' }
        }
      }
    })
  }

  // Clear validation errors while the user types
  const emailInput = document.getElementById('profile-email-input')
  const phoneInput = document.getElementById('profile-phone-input')
  const newPwdInput = document.getElementById('profile-new-password-input')
  if (emailInput) {
    emailInput.removeEventListener('input', () => clearFieldError('profile-email-input'))
    emailInput.addEventListener('input', () => clearFieldError('profile-email-input'))
  }
  if (phoneInput) {
    phoneInput.removeEventListener('input', () => clearFieldError('profile-phone-input'))
    phoneInput.addEventListener('input', () => clearFieldError('profile-phone-input'))
  }
  if (newPwdInput) {
    newPwdInput.removeEventListener('input', () => clearFieldError('profile-new-password-input'))
    newPwdInput.addEventListener('input', () => clearFieldError('profile-new-password-input'))
  }
}

// Validación de email con blacklist para correos de prueba
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!re.test(email)) return false
  const banned = /example|test|prueba|dummy|fake|temporal|correo-de-prueba|pruebas/i
  if (banned.test(email)) return false
  return true
}

// Helper: leer archivo como dataURL (Promise)
function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Note: password hashing was removed from client-side to match server login expectations.
// Storing/handling raw passwords in the client is not recommended for production.
// For now we keep password handling simple to remain compatible with the existing backend.

async function saveProfile() {
  // Clear previous inline errors
  clearFieldError('profile-current-password-input')
  clearFieldError('profile-new-password-input')
  clearFieldError('profile-photo-input')

  const name = document.getElementById("profile-name-input")?.value
  const email = document.getElementById("profile-email-input")?.value
  const phone = document.getElementById("profile-phone-input")?.value
  const address = document.getElementById("profile-address-input")?.value
  const photoInput = document.getElementById("profile-photo-input")
  const currentPwdInput = document.getElementById('profile-current-password-input')
  const newPwdInput = document.getElementById('profile-new-password-input')
  const currentPwdValue = currentPwdInput?.value || ''
  const newPwdValue = newPwdInput?.value || ''

  const existing = JSON.parse(localStorage.getItem('userSession')) || {}

  try {
    // If user provided current password but not new password, prompt to enter new one
    if (currentPwdValue && !newPwdValue) {
      showFieldError('profile-new-password-input', 'Ingresa la nueva contraseña')
      return
    }

    // Validaciones: email, telefono y longitud de contraseña
    if (email && email.trim() !== '') {
      if (!isValidEmail(email.trim())) {
        showFieldError('profile-email-input', 'Correo inválido o de prueba no permitido')
        return
      }
    }

    if (phone && phone.trim() !== '') {
      // aceptar sólo dígitos y exacto 10
      const digits = phone.replace(/\D/g, '')
      if (digits.length !== 10) {
        showFieldError('profile-phone-input', 'El celular debe contener exactamente 10 dígitos')
        return
      }
    }

    if (newPwdValue && newPwdValue.length < 8) {
      showFieldError('profile-new-password-input', 'La contraseña debe tener al menos 8 caracteres')
      return
    }

    // Build payload with only changed fields to avoid sending large, unchanged avatar data
    const updatePayload = {}

    if (typeof name === 'string' && name.trim() !== '' && name.trim() !== (existing.nombre || '')) updatePayload.nombre = name.trim()
    if (typeof email === 'string' && email.trim() !== '' && email.trim() !== (existing.email || existing.correo || '')) updatePayload.correo = email.trim()
    if (typeof phone === 'string' && phone.trim() !== '' && phone.trim() !== (existing.telefono || existing.celular || '')) updatePayload.celular = phone.trim()
    if (typeof address === 'string' && address.trim() !== '' && address.trim() !== (existing.direccion || '')) updatePayload.direccion = address.trim()

    // Manejar cambio de contraseña: si se proporcionó nueva contraseña
    if (newPwdValue) {
      // Si ya existe password almacenada en localStorage (no común), validar con la actual
      if (existing.password) {
        if (!currentPwdValue) {
          showFieldError('profile-current-password-input', 'Ingresa tu contraseña actual para cambiarla')
          return
        }
        if (currentPwdValue !== existing.password) {
          showFieldError('profile-current-password-input', 'Contraseña actual incorrecta')
          return
        }
      }

      // Enviar la contraseña en texto plano (el backend actual espera contrasena en texto)
      updatePayload.password = newPwdValue
    }

    // Sólo añadir avatar si el usuario seleccionó un nuevo archivo
    if (photoInput && photoInput.files && photoInput.files[0]) {
      const file = photoInput.files[0]
      const dataUrl = await readFileAsDataURL(file)
      updatePayload.avatar = dataUrl
    }

    if (Object.keys(updatePayload).length === 0) {
      showNotification('No hay cambios para guardar', 'info')
      return
    }

    // Enviar sólo los campos cambiados al backend
    const resp = await fetch('http://localhost:3000/perfil', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatePayload)
    })

    if (!resp.ok) {
      // Try to parse JSON error body, or show generic
      let parsed = null
      try { parsed = await resp.json() } catch (e) { /* ignore */ }
      const msg = (parsed && parsed.message) ? parsed.message : `Error del servidor: ${resp.status}`
      showNotification(msg, 'warning')
      return
    }

    const result = await resp.json()
    if (!result || !result.success) {
      const msg = (result && result.message) ? result.message : 'Error al guardar perfil en servidor'
      showNotification(msg, 'warning')
      return
    }

    // Actualizar localStorage con la versión del servidor (más fiable)
    const serverUser = result.user || {}
    const currentStored = JSON.parse(localStorage.getItem('userSession')) || {}
    const toStore = Object.assign({}, currentStored, {
      nombre: serverUser.nombre || currentStored.nombre,
      email: serverUser.correo || serverUser.email || currentStored.email,
      telefono: serverUser.celular || serverUser.telefono || currentStored.telefono,
      direccion: serverUser.direccion || currentStored.direccion,
      avatar: serverUser.avatar || currentStored.avatar
    })

    localStorage.setItem('userSession', JSON.stringify(toStore))
    loadUserProfile()
    showNotification('Perfil actualizado correctamente', 'success')

    // Limpiar campos de contraseña y errores
    if (currentPwdInput) currentPwdInput.value = ''
    if (newPwdInput) newPwdInput.value = ''
    clearFieldError('profile-current-password-input')
    clearFieldError('profile-new-password-input')

    // actualizar preview si existe y el avatar cambió
    const previewImg = document.getElementById('profile-avatar-preview')
    if (previewImg && updatePayload.avatar) { previewImg.src = updatePayload.avatar; previewImg.style.display = 'block' }

  } catch (err) {
    console.error('Error guardando perfil:', err)
    showNotification('Error al guardar perfil', 'warning')
  }
}

// Mostrar previsualización cuando el usuario selecciona una imagen
document.addEventListener('change', (e) => {
  if (e.target && e.target.id === 'profile-photo-input') {
    const file = e.target.files && e.target.files[0]
    const previewImg = document.getElementById('profile-avatar-preview')
    if (!previewImg) return
    if (file) {
      const reader = new FileReader()
      reader.onload = function(ev) {
        previewImg.src = ev.target.result
        previewImg.style.display = 'block'
      }
      reader.readAsDataURL(file)
    } else {
      previewImg.src = ''
      previewImg.style.display = 'none'
    }
  }
})

function editProfile() {
  showTab("profile")
  // Find and click the profile tab button
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    if (btn.textContent.includes("Mi Perfil")) {
      btn.classList.add("active")
    } else {
      btn.classList.remove("active")
    }
  })
}

function logout() {
  // // Mostrar modal de confirmación de logout (reemplaza confirm())
  const modal = document.getElementById('logout-modal')
  if (modal) modal.style.display = 'flex'
}

function cancelLogout() {
  const modal = document.getElementById('logout-modal')
  if (modal) modal.style.display = 'none'
}

async function confirmLogout() {
  // Llamar al backend para destruir la sesión
  try {
    const modal = document.getElementById('logout-modal')
    // disable buttons to avoid double clicks
    const footerButtons = modal ? modal.querySelectorAll('button') : []
    footerButtons.forEach(b => b.disabled = true)

    await fetch('http://localhost:3000/logout', {
      method: 'POST',
      credentials: 'include'
    })
  } catch (err) {
    console.warn('Logout API failed:', err)
  } finally {
    // Ocultar modal
    const modal = document.getElementById('logout-modal')
    if (modal) modal.style.display = 'none'

    // Limpiar sesión local
    localStorage.removeItem('userSession')
    // Opcional: limpiar carrito y estado de UI
    // localStorage.removeItem('bookCart')

    // Actualizar UI local y mostrar confirmación en esta misma vista
    try { loadUserProfile() } catch (e) { /* ignore */ }
    // Redirect to login page without showing any toast/notification
    try { window.location.href = 'login.html' } catch (e) { /* ignore */ }
  }
}

// Conectar la X del modal para cerrarlo (si existe)
document.addEventListener('DOMContentLoaded', () => {
  const closeX = document.getElementById('logout-modal-close')
  if (closeX) closeX.addEventListener('click', () => {
    const modal = document.getElementById('logout-modal')
    if (modal) modal.style.display = 'none'
  })
})



function proceedToCheckout() {
  fetch('http://localhost:3000/carrito', { credentials: 'include' })
    .then(res => res.json())
    .then(data => {
      if (!data.success || !data.items || data.items.length === 0) {
        try { showNotification('Tu carrito está vacío o no se pudo cargar.', 'warning') } catch (e) { console.warn('Tu carrito está vacío o no se pudo cargar.') }
        return;
      }

      const checkoutModal = document.getElementById('checkout-modal');
      const checkoutItems = document.getElementById('checkout-items');
      const checkoutTotal = document.getElementById('checkout-total');

      let html = '';
      let total = 0;

      data.items.forEach(item => {
        const itemTotal = Number(item.precio_unitario) * item.cantidad;
        total += itemTotal;
        html += `
          <div class="checkout-item">
            <p><strong>${item.titulo}</strong> x${item.cantidad}</p>
            <p>$${itemTotal.toLocaleString()}</p>
          </div>
        `;
      });

      checkoutItems.innerHTML = html;
      checkoutTotal.textContent = `$${total.toLocaleString()}`;

      // Prefill checkout fields from stored user session (editable)
      try {
        const user = JSON.parse(localStorage.getItem('userSession')) || {}
        const nameEl = document.getElementById('checkout-name')
        const emailEl = document.getElementById('checkout-email')
        const phoneEl = document.getElementById('checkout-phone')
        const addressEl = document.getElementById('checkout-address')

        if (nameEl) nameEl.value = user.nombre || user.name || ''
        if (emailEl) emailEl.value = user.email || user.correo || ''
        if (phoneEl) phoneEl.value = user.telefono || user.celular || ''
        if (addressEl) addressEl.value = user.direccion || user.address || ''
      } catch (e) {
        // ignore parse errors
      }

      // Mostrar el modal (usar flex para centrar según CSS `.modal`)
      checkoutModal.style.display = 'flex';
    })
    .catch(err => {
      console.error('Error al obtener carrito para checkout:', err);
      try { showNotification('Hubo un error al cargar el carrito.', 'warning') } catch (e) { console.warn('Hubo un error al cargar el carrito.') }
    });
}


// cierra modal de pago============
function closeCheckoutModal() {
  const modal = document.getElementById("checkout-modal");
  if (modal) modal.style.display = "none";
}


function confirmOrder() {
  const name = document.getElementById("checkout-name").value.trim();
  const email = document.getElementById("checkout-email").value.trim();
  const phone = document.getElementById("checkout-phone").value.trim();
  const address = document.getElementById("checkout-address").value.trim();

  if (!name || !email || !phone || !address) {
    try { showNotification("Por favor completa todos los campos de entrega.", 'warning') } catch (e) { console.warn('Por favor completa todos los campos de entrega.') }
    return;
  }

  fetch("http://localhost:3000/carrito", { credentials: "include" })
    .then(res => res.json())
    .then(data => {
        if (!data.success || data.items.length === 0) {
        try { showNotification("Tu carrito está vacío. Agrega libros antes de confirmar el pedido.", 'warning') } catch (e) { console.warn('Tu carrito está vacío. Agrega libros antes de confirmar el pedido.') }
        return;
      }

      return fetch("http://localhost:3000/pedidos", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: data.items,
          cliente: {
            nombre: name,
            correo: email,
            telefono: phone,
            direccion: address
          }
        })
      });
    })
    .then(res => res ? res.json() : null)
   .then(orderData => {
  if (orderData && orderData.success) {
    try { showNotification("Pedido confirmado correctamente.", 'success') } catch (e) { console.log('Pedido confirmado correctamente.') }
    
    closeCheckoutModal();

    // Marcar carrito como completado
    fetch("http://localhost:3000/carrito/finalizar", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: 1 }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          console.log("Carrito finalizado en BD");

          // Limpiar el carrito del frontend
          fetch("http://localhost:3000/carrito/limpiar", {
            method: "DELETE",
          }).then(() => {
            // Espera medio segundo antes de recargar la interfaz
            setTimeout(() => {
              loadCart();
              loadOrders();
            }, 500);
          });
        } else {
          console.warn("No se pudo finalizar el carrito:", data.message);
        }
      });
  } else {
    console.error("Error al confirmar pedido:", orderData);
    try { showNotification("Ocurrió un error al confirmar el pedido.", 'warning') } catch (e) { console.error('Ocurrió un error al confirmar el pedido.') }
  }
})

    .catch(err => {
      console.error("Error al procesar pedido:", err);
      try { showNotification("Error de conexión al procesar el pedido.", 'warning') } catch (e) { console.error('Error de conexión al procesar el pedido.') }
    });
}


function showTab(tabName) {
  // Ocultar todas las pestañas de contenido
  document.querySelectorAll(".tab-pane").forEach((pane) => pane.classList.remove("active"));

  // Mostrar la pestaña seleccionada
  const targetPane = document.getElementById(`${tabName}-tab`);
  if (targetPane) targetPane.classList.add("active");

  // Actualizar la clase "active" en los botones de las pestañas
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    const onclickAttr = btn.getAttribute("onclick") || "";
    const matchesSingle = onclickAttr.includes(`showTab('${tabName}')`);
    const matchesDouble = onclickAttr.includes(`showTab(\"${tabName}\")`);
    if (matchesSingle || matchesDouble) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  // Acciones adicionales por pestaña
  if (tabName === "favorites") renderFavorites();
  if (tabName === "orders") loadOrders();
}

function loadOrders() {
  // Mostrar mensaje de carga
  const ordersItems = document.getElementById("orders-items");
  ordersItems.innerHTML = `
    <div class="loading-state">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Cargando tus pedidos...</p>
    </div>
  `;

  fetch("http://localhost:3000/mis-pedidos", { credentials: "include" })
    .then(res => res.json())
    .then(data => {
      ordersItems.innerHTML = "";

      // Actualizar el contador de pedidos
      const ordersStat = document.getElementById("orders-stat");
      console.log("Elemento contador encontrado:", ordersStat); // 👈 agrega esto
      if (ordersStat) {
        const totalPedidos = data.success && data.pedidos ? data.pedidos.length : 0;
        console.log("📦 Total de pedidos:", totalPedidos);
        ordersStat.textContent = totalPedidos;
      }



      if (!data.success || data.pedidos.length === 0) {
        ordersItems.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-box"></i>
            <h3>No tienes pedidos</h3>
            <p>Tus pedidos aparecerán aquí una vez que realices una compra</p>
            <button class="btn-primary" onclick="goToHome()">Explorar Libros</button>
          </div>`;
        return;
      }

      let html = "";

      data.pedidos.forEach(order => {
        let statusText = "";
        let statusClass = "";

        switch (order.estado) {
          case "pendiente":
            // Ocultar el estado "Pendiente" en la vista según petición
            statusText = "";
            statusClass = "";
            break;
          case "enviado":
            statusText = "Enviado";
            statusClass = "status-shipped";
            break;
          case "entregado":
            statusText = "Entregado";
            statusClass = "status-delivered";
            break;
          default:
            statusText = order.estado;
            statusClass = "status-default";
        }

        const itemCount = order.libros.reduce((sum, libro) => sum + libro.cantidad, 0);

        html += `
          <div class="order-card">
              <div class="order-header">
                  <div>
                      <div class="order-number">Pedido #${order.id_pedido}</div>
                      <div style="color: #666; font-size: 0.9rem;">
                          ${new Date(order.fecha_creacion).toLocaleDateString()}
                      </div>
                  </div>
                    ${statusText ? `<div class="order-status ${statusClass}">${statusText}</div>` : ''}
              </div>
              <div class="order-items">
                  <strong>Artículos:</strong> ${itemCount} | 
                  <strong>Total:</strong> $${order.total.toLocaleString()}
              </div>
          </div>
        `;
      });

      ordersItems.innerHTML = html;
    })
    .catch(err => {
      console.error("Error al cargar pedidos:", err);
      ordersItems.innerHTML = `
        <div class="error-state">
          <i class="fas fa-exclamation-triangle"></i>
          <p>No se pudieron cargar tus pedidos. Intenta de nuevo.</p>
        </div>
      `;
    });
}



// ========= FAVORITES FUNCTIONALITY =====

function saveBook(bookId) {
  // Obtener los favoritos guardados (del localStorage)
  let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

  // Verificar si el libro ya está guardado
  if (favorites.includes(bookId)) {
    try { showToast("📚 Este libro ya está en tus favoritos", 'info') } catch (e) { alert("📚 Este libro ya está en tus favoritos") }
    return;
  }

  // Agregar el nuevo libro
  favorites.push(bookId);

  // Guardar en localStorage
  localStorage.setItem("favorites", JSON.stringify(favorites));

  // Actualizar el contador
  updateFavoritesCount();

  try { showToast("❤️ Libro guardado en favoritos", 'success') } catch (e) { alert("❤️ Libro guardado en favoritos") }
}



function renderFavorites() {
  const favorites = getFavorites();
  const favoritesItems = document.getElementById("favorites-items");
  const clearFavoritesBtn = document.getElementById("clear-favorites-btn");
  const favoritesStat = document.getElementById("favorites-stat");

  // 🧮 Actualizar contador
  if (favoritesStat) favoritesStat.textContent = favorites.length;

  // 🧹 Si no hay favoritos, mostrar mensaje vacío
  if (!favorites || favorites.length === 0) {
    favoritesItems.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-heart"></i>
        <h3>No tienes favoritos</h3>
        <p>Guarda libros que te interesen para encontrarlos fácilmente</p>
        <button class="btn-primary" onclick="goToHome()">Explorar Libros</button>
      </div>
    `;
    clearFavoritesBtn.style.display = "none";
    return;
  }

  // 📚 Si hay favoritos, mostrar la lista
  clearFavoritesBtn.style.display = "block";
  let html = "";

  favorites.forEach((book, index) => {
    const price =
      typeof book.price === "number"
        ? book.price
        : Number.parseFloat(book.price?.replace(/[^0-9.-]+/g, "")) || 0;

    html += `
      <div class="item-card">
        <div class="item-header">
          <img src="${book.image || book.imageUrl}" alt="${book.title}" class="item-image">
          <div class="item-info">
            <h3 class="item-title">${book.title}</h3>
            <p class="item-author">por ${book.author || book.authors || "Autor desconocido"}</p>
            <p class="item-price">$${price.toLocaleString()}</p>
          </div>
        </div>
        <div class="item-actions">
          <button class="btn-primary btn-small"
            onclick="addToCartFromFavorites(
              '${book.id}',
              '${book.title.replace(/'/g, "\\'")}',
              '${(book.author || book.authors || "").replace(/'/g, "\\'")}',
              '${price}',
              '${book.image || book.imageUrl}'
            )">
            <i class="fas fa-shopping-cart"></i> Al Carrito
          </button>
          <button class="btn-danger btn-small" onclick="removeFromFavorites(${index})">
            <i class="fas fa-heart-broken"></i> Quitar
          </button>
        </div>
      </div>
    `;
  });

  favoritesItems.innerHTML = html;
}


function updateFavoritesCount() {
  const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  const favoritesStat = document.getElementById("favorites-stat");
  if (favoritesStat) {
    favoritesStat.textContent = favorites.length;
  }
}
function clearFavorites() {
  // Eliminamos sin confirmación (petición del usuario)
  try {
    localStorage.removeItem('favorites')
  } catch (e) { /* ignore */ }
  try { if (typeof loadFavorites === 'function') loadFavorites() } catch (e) { /* ignore */ }
  try { showNotification('Favoritos limpiados', 'info') } catch (e) { console.log('Favoritos limpiados') }
}

function saveBook(id, title, author, price, imageUrl) {
  const favorites = getFavorites();

  // Evitar duplicados
  if (favorites.some(book => book.id === id)) {
    try { showToast("📘 Este libro ya está en tus favoritos", 'info') } catch (e) { alert("📘 Este libro ya está en tus favoritos") }
    return;
  }

  favorites.push({ id, title, author, price, imageUrl });
  saveFavorites(favorites);
  renderFavorites();
  try { showToast("❤️ Libro añadido a favoritos", 'success') } catch (e) { alert("❤️ Libro añadido a favoritos") }
}













function clearCart() {
  confirmWithToast('¿Estás seguro de vaciar el carrito?', () => {
    // Intentar limpiar en servidor (si hay sesión). Si falla, hacer fallback local.
    fetch('http://localhost:3000/carrito/limpiar', {
      method: 'DELETE',
      credentials: 'include'
    })
    .then(res => res.json().catch(() => ({ success: false })))
    .then(data => {
      try { localStorage.removeItem('bookCart') } catch (e) { /* ignore */ }
      try { updateAllCounts() } catch (e) { /* ignore */ }
      if (data && data.success) {
        if (typeof loadCart === 'function') { try { loadCart() } catch (e) { /* ignore */ } }
      } else {
        // Si backend no respondió éxito, recargar desde local fallback
        if (typeof loadCart === 'function') { try { loadCart() } catch (e) { /* ignore */ } }
      }
      try { showNotification('Carrito vaciado', 'info') } catch (e) { console.log('Carrito vaciado') }
    })
    .catch(err => {
      // Fallback local
      try { localStorage.removeItem('bookCart') } catch (e) { /* ignore */ }
      try { updateAllCounts() } catch (e) { /* ignore */ }
      if (typeof loadCart === 'function') { try { loadCart() } catch (e) { /* ignore */ } }
      try { showNotification('Carrito vaciado (local)', 'info') } catch (e) { console.log('Carrito vaciado (local)') }
    })
  }, () => {
    try { showNotification('Acción cancelada', 'info') } catch (e) { /* ignore */ }
  })
}

// ===== FAVORITES FUNCTIONALITY =====
function getFavorites() {
  const favorites = localStorage.getItem("bookFavorites")
  return favorites ? JSON.parse(favorites) : []
}

function saveFavorites(favorites) {
  localStorage.setItem("bookFavorites", JSON.stringify(favorites))
  updateAllCounts()
  renderFavorites()
}



function addToCartFromFavorites(bookId, title, authors, price, imageUrl) {
  // Intentar primero agregar al carrito del servidor (si el usuario tiene sesión)
  const parsedPrice = Number.parseFloat(String(price).replace(/[^0-9.-]+/g, "")) || 0

  fetch('http://localhost:3000/carrito/agregar', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      libro_id_api: bookId,
      titulo: title,
      cantidad: 1,
      precio_unitario: parsedPrice,
      imagen: imageUrl
    })
  })
  .then(res => res.json())
  .then(data => {
    if (data && data.success) {
      showNotification(`"${title}" añadido al carrito`, 'success')
      // refrescar la vista del carrito (usa loadCart que renderiza desde servidor)
      if (typeof loadCart === 'function') {
        try { loadCart() } catch (e) { /* ignore */ }
      }
      try { updateAllCounts() } catch (e) { /* ignore */ }
      return
    }

    // Si el servidor no respondió con éxito, fallback a localStorage
    fallbackAddToLocal()
  })
  .catch(err => {
    // En caso de error de red, usar fallback local
    console.warn('Error agregando al carrito en el servidor, usando localStorage:', err)
    fallbackAddToLocal()
  })

  function fallbackAddToLocal() {
    const newBook = {
      id: bookId,
      title,
      author: authors,
      price: parsedPrice,
      image: imageUrl,
      quantity: 1,
    }

    const cart = getCart()
    const existingIndex = cart.findIndex((book) => book.id === bookId)

    if (existingIndex !== -1) {
      cart[existingIndex].quantity += 1
      showNotification(`"${title}" cantidad actualizada en el carrito`, "success")
    } else {
      cart.push(newBook)
      showNotification(`"${title}" añadido al carrito`, "success")
    }

    saveCart(cart)
  }
}

function removeFromFavorites(index) {
  const favorites = getFavorites()
  const removedBook = favorites[index]
  favorites.splice(index, 1)
  saveFavorites(favorites)
  showNotification(`"${removedBook.title}" eliminado de favoritos`, "info")
}

function clearFavorites() {
  // Eliminamos todos los favoritos sin confirmación (petición del usuario)
  try { localStorage.removeItem('bookFavorites') } catch (e) { /* ignore */ }
  try { updateAllCounts() } catch (e) { /* ignore */ }
  try { renderFavorites() } catch (e) { /* ignore */ }
  try { showNotification('Favoritos limpiados', 'info') } catch (e) { console.log('Favoritos limpiados') }
}

// ===== ORDERS FUNCTIONALITY =====
function getOrders() {
  const orders = localStorage.getItem("bookOrders")
  return orders ? JSON.parse(orders) : []
}

// Obtener carrito guardado en localStorage (fallback cuando no hay sesión)
function getCart() {
  const cart = localStorage.getItem('bookCart') || localStorage.getItem('bookCart')
  try {
    return cart ? JSON.parse(cart) : []
  } catch (e) {
    console.warn('getCart parse error', e)
    return []
  }
}

// Guardar carrito en localStorage y actualizar contadores/UI
function saveCart(cart) {
  try {
    localStorage.setItem('bookCart', JSON.stringify(cart || []))
  } catch (e) {
    console.warn('saveCart error', e)
  }

  // actualizar contadores y vistas si existen
  try { updateAllCounts() } catch (e) { /* ignore */ }
  // Preferir llamadas seguras a funciones que puedan no estar definidas
  if (typeof renderCart === 'function') {
    try { renderCart() } catch (e) { /* ignore */ }
  } else if (typeof loadCart === 'function') {
    try { loadCart() } catch (e) { /* ignore */ }
  }
}

function saveOrder(order) {
  const orders = getOrders()
  orders.unshift(order) // Add to beginning of array
  localStorage.setItem("bookOrders", JSON.stringify(orders))
  updateAllCounts()
  renderOrders()
}




// ===== UTILITY FUNCTIONS =====
function updateAllCounts() {
  // First: populate quickly from localStorage so UI is responsive
  const localCart = getCart() || []
  const localFavorites = getFavorites() || []
  const localOrders = getOrders() || []

  const headerCartCount = document.getElementById('header-cart-count')
  const cartStat = document.getElementById('cart-stat')
  const favoritesStat = document.getElementById('favorites-stat')
  const ordersStat = document.getElementById('orders-stat')

  const localCartCount = (localCart || []).reduce((t, it) => t + (it.quantity || it.cantidad || 0), 0)
  if (headerCartCount) headerCartCount.textContent = localCartCount
  if (cartStat) cartStat.textContent = localCartCount
  if (favoritesStat) favoritesStat.textContent = localFavorites.length
  if (ordersStat) ordersStat.textContent = localOrders.length

  // Then: try to fetch authoritative counts from backend if session cookie exists
  // We don't block UI on these requests; if they succeed we overwrite the counts.
  fetch('http://localhost:3000/carrito', { credentials: 'include' })
    .then(res => res.json())
    .then(data => {
      if (data && data.success && Array.isArray(data.items)) {
        const serverCartCount = data.items.reduce((t, it) => t + (it.cantidad || it.cantidad === 0 ? Number(it.cantidad) : (it.quantity || 0)), 0)
        if (headerCartCount) headerCartCount.textContent = serverCartCount
        if (cartStat) cartStat.textContent = serverCartCount
      }
    })
    .catch(() => { /* ignore, keep local values */ })

  fetch('http://localhost:3000/mis-pedidos', { credentials: 'include' })
    .then(res => res.json())
    .then(data => {
      if (data && data.success && Array.isArray(data.pedidos)) {
        if (ordersStat) ordersStat.textContent = data.pedidos.length
      }
    })
    .catch(() => { /* ignore, keep local values */ })
}

function showNotification(message, type = "success") {
  const notification = document.getElementById("notification")
  const notificationText = document.getElementById("notification-text")

  // Remove existing classes
  notification.className = "notification"

  // Add type class
  notification.classList.add(`notification-${type}`)

  notificationText.textContent = message
  notification.classList.add("show")

  setTimeout(() => {
    notification.classList.remove("show")
  }, 3000)
}

// Show an inline error message under a specific input
function showFieldError(inputId, message) {
  try {
    clearFieldError(inputId)
    const input = document.getElementById(inputId)
    if (!input) return
    const err = document.createElement('div')
    err.className = 'field-error'
    err.id = inputId + '-error'
    err.style.color = '#dc3545'
    err.style.fontSize = '0.9rem'
    err.style.marginTop = '6px'
    err.textContent = message
    input.parentNode.appendChild(err)
  } catch (e) {
    console.warn('showFieldError failed', e)
  }
}

function clearFieldError(inputId) {
  const existing = document.getElementById(inputId + '-error')
  if (existing && existing.parentNode) existing.parentNode.removeChild(existing)
}

// ===== EVENT LISTENERS =====
// Close modal when clicking outside
window.onclick = (event) => {
  const modal = document.getElementById("checkout-modal")
  if (event.target === modal) {
    closeCheckoutModal()
  }

  // Also close logout modal when clicking outside
  const logoutModal = document.getElementById('logout-modal')
  if (logoutModal && event.target === logoutModal) {
    logoutModal.style.display = 'none'
  }
}

// Close modal with Escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    const modal = document.getElementById("checkout-modal")
    if (modal.style.display === "block") {
      closeCheckoutModal()
    }
  }
})

