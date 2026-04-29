

// ===== BANCO: Lógica de cuenta bancaria en perfil =====
document.addEventListener('DOMContentLoaded', function () {

  const addBtn = document.getElementById('add-bank-btn');
  const form = document.getElementById('bank-account-form');
  const view = document.getElementById('bank-account-view');
  const mensaje = document.getElementById("bank-message");

  // Mostrar formulario
  if (addBtn) {
    addBtn.onclick = function () {
      addBtn.style.display = 'none';
      form.style.display = 'block';
      view.style.display = 'none';
      if (form.reset) form.reset();
      if (mensaje) mensaje.innerText = "";
    };
  }

  // Cargar cuenta al iniciar
  mostrarCuentaBancaria();

  // ===== GUARDAR CUENTA =====
  if (form) form.onsubmit = async function (e) {
    e.preventDefault();


     const mensaje = document.getElementById("bank-message"); 

    const banco = document.getElementById('bank-name').value.trim();
    const titular = document.getElementById('bank-holder').value.trim();
    const clabe = document.getElementById('bank-clabe').value.trim();
    const tipo = document.getElementById('bank-type').value;

    // Validación
    if (!banco || !titular || !clabe || clabe.length !== 18) {
      mensaje.innerText = "Completa todos los campos correctamente ❌";
      mensaje.className = "form-message error";
      return;
    }

    const cuenta = { banco, titular, clabe, tipo };

    //  Cargando
    mensaje.innerText = "Guardando cuenta...";
    mensaje.className = "form-message loading";

    try {
      const resp = await fetch('http://localhost:3000/cuenta-bancaria', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cuenta)
      });

      const data = await resp.json();

      if (!data.success) throw new Error(data.message);

      //  Éxito
      mensaje.innerText = "Cuenta guardada correctamente ";
      mensaje.className = "form-message success";

      mostrarCuentaBancaria();

      form.style.display = 'none';
      addBtn.style.display = 'none';
      view.style.display = 'block';

      // Limpiar mensaje después de unos segundos
      setTimeout(() => {
        mensaje.innerText = "";
      }, 3000);

    } catch (err) {
      mensaje.innerText = "Error al guardar la cuenta ❌";
      mensaje.className = "form-message error";
    }
  };
});


// ===== MOSTRAR CUENTA DESDE BACKEND =====
async function mostrarCuentaBancaria() {
  try {
    const resp = await fetch('http://localhost:3000/cuenta-bancaria', {
      method: 'GET',
      credentials: 'include'
    });

    const data = await resp.json();

    if (!data.success || !data.cuenta) return;

    const cuenta = data.cuenta;

    document.getElementById('bank-view-bank').innerText = cuenta.banco;
    document.getElementById('bank-view-holder').innerText = cuenta.titular;

    //  Ocultar CLABE (solo últimos 4)
    const ultimos = cuenta.clabe.slice(-4);
    document.getElementById('bank-view-clabe').innerText = "**** **** " + ultimos;

    document.getElementById('bank-view-type').innerText = cuenta.tipo;

    document.getElementById('bank-account-view').style.display = 'block';
    document.getElementById('add-bank-btn').style.display = 'none';
    document.getElementById('bank-account-form').style.display = 'none';

  } catch (error) {
    console.error("Error cargando cuenta:", error);
  }
}


async function cargarCuentaEnCheckout() {
  try {
    const resp = await fetch("http://localhost:3000/cuenta-bancaria", {
      method: "GET",
      credentials: "include"
    });

    const data = await resp.json();

    if (!data.success || !data.cuenta) {
      console.warn("No hay cuenta bancaria");
      return;
    }

    const cuenta = data.cuenta;

    // Llenar campos
    document.getElementById("checkout-bank").value = cuenta.banco;
    document.getElementById("checkout-holder").value = cuenta.titular;

    // Ocultar cuenta (solo últimos 4)
    const ultimos = cuenta.clabe.slice(-4);
    document.getElementById("checkout-account").value = "**** **** " + ultimos;

  } catch (error) {
    console.error("Error cargando cuenta en checkout:", error);
  }
  cargarCuentaEnCheckout();
}



// ELIMINAR LA CEUNTA BANCARIA
async function deleteBankAccount() {
  const mensaje = document.getElementById("bank-message");

  // 🔄 estado cargando
  if (mensaje) {
    mensaje.innerText = "Eliminando cuenta...";
    mensaje.className = "form-message loading";
  }

  try {
    const resp = await fetch('http://localhost:3000/cuenta-bancaria', {
      method: 'DELETE',
      credentials: 'include'
    });

    const data = await resp.json();

    if (!data.success) throw new Error();

    // 🧹 limpiar UI
    localStorage.removeItem('userBankAccount');

    document.getElementById('bank-account-view').style.display = 'none';
    document.getElementById('add-bank-btn').style.display = 'block';

    //  mensaje éxito
    if (mensaje) {
      mensaje.innerText = "Cuenta eliminada correctamente ✅";
      mensaje.className = "form-message success";
    }

  } catch (error) {
    console.error(error);

    // mensaje error
    if (mensaje) {
      mensaje.innerText = "Error al eliminar la cuenta ❌";
      mensaje.className = "form-message error";
    }
  }
}




function loadCart() {
  fetch('http://localhost:3000/carrito', { credentials: 'include' })
    .then(res => res.json())
    .then(data => {
      const cartItemsContainer = document.getElementById('cart-items');
      const cartSummary = document.getElementById('cart-summary');
      const clearCartBtn = document.getElementById('clear-cart-btn');
      const cartStat = document.getElementById('cart-stat');

      const renderLocalCart = (localCart) => {
        // Agrupar por id/libro_id_api
        const grouped = {};
        localCart.forEach(it => {
          const key = String(it.libro_id_api || it.id || it.titulo)
          if (!grouped[key]) grouped[key] = Object.assign({}, it, { cantidad: Number(it.quantity || it.cantidad || 1) })
          else grouped[key].cantidad += Number(it.quantity || it.cantidad || 1)
        })

        let html = ''
        let subtotal = 0
        let totalItems = 0

        Object.values(grouped).forEach(item => {
          const unit = parseNumberString(item.precio_unitario || item.precio || item.price || 0)
          const qty = Number(item.cantidad || 0)
          const itemTotal = unit * qty
          subtotal += itemTotal
          totalItems += qty

          html += `
            <div class="item-card">
              <div class="item-header">
                <img src="${item.imagen || item.image || item.imageUrl || ''}" alt="${item.titulo || item.title || ''}" class="item-image">
                <div class="item-info">
                  <h3 class="item-title">${item.titulo || item.title || ''}</h3>
                  <p class="item-author">por Autor Desconocido</p>
                  <p class="item-price">$${unit.toLocaleString()}</p>
                </div>
              </div>
              <div class="quantity-controls">
                <button class="quantity-btn" onclick="updateQuantity('${item.libro_id_api || item.id || item.title}', -1)">-</button>
                <span class="quantity">${qty}</span>
                <button class="quantity-btn" onclick="updateQuantity('${item.libro_id_api || item.id || item.title}', 1)">+</button>
              </div>
              <div class="item-actions">
                <div style="font-weight: bold; color: #667eea;">Total: $${itemTotal.toLocaleString()}</div>
                <button class="btn-danger btn-small" onclick="removeFromCart('${item.libro_id_api || item.id || item.title}')">
                  <i class="fas fa-trash"></i> Eliminar
                </button>
              </div>
            </div>
          `
        })

        cartItemsContainer.innerHTML = html
        cartStat.innerText = totalItems
        cartSummary.style.display = totalItems > 0 ? 'block' : 'none'
        clearCartBtn.style.display = totalItems > 0 ? 'inline-block' : 'none'
        try { document.getElementById('cart-subtotal').innerText = `$${subtotal.toLocaleString()}` } catch (e) { /* ignore */ }
        try { document.getElementById('cart-total').innerText = `$${subtotal.toLocaleString()}` } catch (e) { /* ignore */ }
      }

      // Merge: combinar carrito del servidor (si existe) con carrito local para evitar
      // que items guardados solo en localStorage queden invisibles en la UI.
      try {
        const serverItems = (data && data.success && Array.isArray(data.items)) ? data.items : []
        const localItems = getCart() || []

        // Mapear por clave única (libro_id_api o id)
        const map = new Map()

        const pushToMap = (it, source) => {
          const key = String(it.libro_id_api || it.id || it.titulo || '')
          if (!map.has(key)) {
            // Normalizar campos mínimos
            map.set(key, Object.assign({}, it, {
              cantidad: Number(it.cantidad || it.quantity || 0),
              precio_unitario: parseNumberString(it.precio_unitario || it.precio || it.price || 0)
            }))
          } else {
            const existing = map.get(key)
            existing.cantidad = Number(existing.cantidad || 0) + Number(it.cantidad || it.quantity || 0)
            // preferir datos del servidor para imagen/titulo/precio cuando vengan from server
            if (source === 'server') {
              existing.titulo = it.titulo || existing.titulo
              existing.imagen = it.imagen || existing.imagen
              existing.precio_unitario = parseNumberString(it.precio_unitario || existing.precio_unitario || 0)
            }
            map.set(key, existing)
          }
        }

        // Primero añadir server items (prioritarios)
        serverItems.forEach(it => pushToMap(it, 'server'))
        // Luego añadir local items (sin sobrescribir server fields)
        localItems.forEach(it => pushToMap(it, 'local'))

        // Renderizar agrupados
        let html = ''
        let subtotal = 0
        let totalItems = 0

        Array.from(map.values()).forEach(item => {
          const unit = parseNumberString(item.precio_unitario || item.precio || item.price || 0)
          const qty = Number(item.cantidad || 0)
          const itemTotal = unit * qty
          subtotal += itemTotal
          totalItems += qty

          const idKey = item.libro_id_api || item.id || item.titulo || ''

          html += `
            <div class="item-card">
              <div class="item-header">
                <img src="${item.imagen || item.image || item.imageUrl || ''}" alt="${item.titulo || item.title || ''}" class="item-image">
                <div class="item-info">
                  <h3 class="item-title">${item.titulo || item.title || ''}</h3>
                  <p class="item-author">por Autor Desconocido</p>
                  <p class="item-price">$${unit.toLocaleString()}</p>
                </div>
              </div>
              <div class="quantity-controls">
                <button class="quantity-btn" onclick="updateQuantity('${idKey}', -1)">-</button>
                <span class="quantity">${qty}</span>
                <button class="quantity-btn" onclick="updateQuantity('${idKey}', 1)">+</button>
              </div>
              <div class="item-actions">
                <div style="font-weight: bold; color: #667eea;">Total: $${itemTotal.toLocaleString()}</div>
                <button class="btn-danger btn-small" onclick="removeFromCart('${idKey}')">
                  <i class="fas fa-trash"></i> Eliminar
                </button>
              </div>
            </div>
          `
        })

        cartItemsContainer.innerHTML = html || `
          <div class="empty-state">
            <i class="fas fa-shopping-cart"></i>
            <h3>Tu carrito está vacío</h3>
            <p>Explora nuestros libros y añade algunos a tu carrito</p>
            <button class="btn-primary" onclick="goToHome()">Explorar Libros</button>
          </div>
        `

        cartStat.innerText = totalItems
        cartSummary.style.display = totalItems > 0 ? 'block' : 'none'
        clearCartBtn.style.display = totalItems > 0 ? 'inline-block' : 'none'
        try { document.getElementById('cart-subtotal').innerText = `$${subtotal.toLocaleString()}` } catch (e) { /* ignore */ }
        try { document.getElementById('cart-total').innerText = `$${subtotal.toLocaleString()}` } catch (e) { /* ignore */ }

      } catch (e) {
        console.warn('Error merging carts in loadCart:', e)
        // fallback: intentar mostrar local
        try {
          const localCart = getCart() || []
          if (localCart.length > 0) {
            renderLocalCart(localCart)
            return
          }
        } catch (ee) { /* ignore */ }

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
    .catch(err => {
      console.error('Error al cargar carrito:', err);
      // En caso de error de red, intentar mostrar el carrito local
      try {
        const localCart = getCart() || []
        if (localCart.length > 0) {
          const cartItemsContainer = document.getElementById('cart-items');
          const cartSummary = document.getElementById('cart-summary');
          const clearCartBtn = document.getElementById('clear-cart-btn');
          const cartStat = document.getElementById('cart-stat');
          // Reuse render logic
          const grouped = {};
          localCart.forEach(it => {
            const key = String(it.libro_id_api || it.id || it.titulo)
            if (!grouped[key]) grouped[key] = Object.assign({}, it, { cantidad: Number(it.quantity || it.cantidad || 1) })
            else grouped[key].cantidad += Number(it.quantity || it.cantidad || 1)
          })

          let html = ''
          let subtotal = 0
          let totalItems = 0
          Object.values(grouped).forEach(item => {
            const unit = parseNumberString(item.precio_unitario || item.precio || item.price || 0)
            const qty = Number(item.cantidad || 0)
            const itemTotal = unit * qty
            subtotal += itemTotal
            totalItems += qty
            html += `
              <div class="item-card">
                <div class="item-header">
                  <img src="${item.imagen || item.image || item.imageUrl || ''}" alt="${item.titulo || item.title || ''}" class="item-image">
                  <div class="item-info">
                    <h3 class="item-title">${item.titulo || item.title || ''}</h3>
                    <p class="item-author">por Autor Desconocido</p>
                    <p class="item-price">$${unit.toLocaleString()}</p>
                  </div>
                </div>
                <div class="quantity-controls">
                  <button class="quantity-btn" onclick="updateQuantity('${item.libro_id_api || item.id || item.title}', -1)">-</button>
                  <span class="quantity">${qty}</span>
                  <button class="quantity-btn" onclick="updateQuantity('${item.libro_id_api || item.id || item.title}', 1)">+</button>
                </div>
                <div class="item-actions">
                  <div style="font-weight: bold; color: #667eea;">Total: $${itemTotal.toLocaleString()}</div>
                  <button class="btn-danger btn-small" onclick="removeFromCart('${item.libro_id_api || item.id || item.title}')">
                    <i class="fas fa-trash"></i> Eliminar
                  </button>
                </div>
              </div>
            `
          })

          cartItemsContainer.innerHTML = html
          cartStat.innerText = totalItems
          cartSummary.style.display = totalItems > 0 ? 'block' : 'none'
          clearCartBtn.style.display = totalItems > 0 ? 'inline-block' : 'none'
          try { document.getElementById('cart-subtotal').innerText = `$${subtotal.toLocaleString()}` } catch (e) { /* ignore */ }
          try { document.getElementById('cart-total').innerText = `$${subtotal.toLocaleString()}` } catch (e) { /* ignore */ }
          return
        }
      } catch (e) { /* ignore */ }
    });

      

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
    // Intentar eliminar en servidor; si el servidor responde que no existe, hacer fallback local
    fetch(`http://localhost:3000/carrito/${encodeURIComponent(libro_id_api)}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    .then(res => res.json().catch(() => ({ success: false })))
    .then(data => {
      if (data && data.success) {
        try { showNotification('Libro eliminado del carrito', 'success') } catch (e) { console.log('Libro eliminado del carrito') }
        if (typeof loadCart === 'function') { try { loadCart() } catch (e) { /* ignore */ } }
        return
      }

      // Si servidor no encontró el libro o hubo error, intentar eliminar del carrito local
      try {
        const raw = localStorage.getItem('bookCart')
        let cart = raw ? JSON.parse(raw) : []
        const idx = cart.findIndex(item => String(item.id) === String(libro_id_api) || String(item.libro_id_api) === String(libro_id_api) || String(item.titulo) === String(libro_id_api))
        if (idx !== -1) {
          const removed = cart.splice(idx, 1)[0]
          localStorage.setItem('bookCart', JSON.stringify(cart))
          try { showNotification(`"${removed?.titulo || removed?.title || removed?.id}" eliminado del carrito (local)`, 'success') } catch (e) { /* ignore */ }
          if (typeof loadCart === 'function') { try { loadCart() } catch (e) { /* ignore */ } }
          return
        }
      } catch (e) {
        console.warn('Fallback local removeFromCart failed', e)
      }

      // Si no se encontró en servidor ni en local, informar al usuario
      try { showNotification(data && data.message ? data.message : 'Libro no encontrado en el carrito', 'warning') } catch (e) { console.error(data && data.message ? data.message : 'Libro no encontrado en el carrito') }
    })
    .catch(err => {
      console.warn('Error en fetch removeFromCart, intentando fallback local:', err)
      try {
        const raw = localStorage.getItem('bookCart')
        let cart = raw ? JSON.parse(raw) : []
        const idx = cart.findIndex(item => String(item.id) === String(libro_id_api) || String(item.libro_id_api) === String(libro_id_api) || String(item.titulo) === String(libro_id_api))
        if (idx !== -1) {
          const removed = cart.splice(idx, 1)[0]
          localStorage.setItem('bookCart', JSON.stringify(cart))
          try { showNotification(`"${removed?.titulo || removed?.title || removed?.id}" eliminado del carrito (local)`, 'success') } catch (e) { /* ignore */ }
          if (typeof loadCart === 'function') { try { loadCart() } catch (e) { /* ignore */ } }
          return
        }
      } catch (e) { console.error('Fallback removeFromCart final failure', e) }
    });
  }, () => {
    try { showNotification('Eliminación cancelada', 'info') } catch (e) { /* ignore */ }
  })
}



// ===== INITIALIZATION =====
document.addEventListener("DOMContentLoaded", () => {
  loadUserProfile()
  updateAllCounts()
  // Intentar sincronizar items locales pendientes al servidor antes de cargar el carrito
  try { syncLocalCartToServer().catch(() => {}) } catch (e) { /* ignore */ }
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



// Mezcla items del servidor y del localStorage, sumando cantidades y prefiriendo
// campos del servidor cuando estén presentes.
function mergeServerAndLocal(serverItems) {
  const local = getCart() || [];
  const map = new Map();

  const push = (it, source) => {
    const key = String(it.libro_id_api || it.id || it.titulo || '');
    if (!map.has(key)) {
      map.set(key, {
        libro_id_api: it.libro_id_api || it.id || it.titulo || '',
        titulo: it.titulo || it.title || '',
        imagen: it.imagen || it.image || it.imageUrl || '',
        precio_unitario: parseNumberString(it.precio_unitario || it.precio || it.price || 0),
        cantidad: Number(it.cantidad || it.quantity || 0)
      });
    } else {
      const existing = map.get(key);
      existing.cantidad = Number(existing.cantidad || 0) + Number(it.cantidad || it.quantity || 0);
      if (source === 'server') {
        if (it.titulo) existing.titulo = it.titulo;
        if (it.imagen) existing.imagen = it.imagen;
        existing.precio_unitario = parseNumberString(it.precio_unitario || existing.precio_unitario || 0);
      }
      map.set(key, existing);
    }
  };

  (Array.isArray(serverItems) ? serverItems : []).forEach(it => push(it, 'server'));
  local.forEach(it => push(it, 'local'));

  return Array.from(map.values());
}


// Parsear cadenas numéricas en formatos localizados (ej: "23.000", "23,000.50", "23,000", "23.50")
function parseNumberString(input) {
  if (input == null) return 0;
  let s = String(input).trim();
  if (!s) return 0;
  // eliminar símbolos de moneda y espacios
  s = s.replace(/[^0-9,.-]/g, '');
  const hasDot = s.indexOf('.') !== -1;
  const hasComma = s.indexOf(',') !== -1;

  if (hasDot && hasComma) {
    // el separador decimal es el último que aparece
    if (s.lastIndexOf('.') > s.lastIndexOf(',')) {
      // punto como decimal, eliminar comas de miles
      s = s.replace(/,/g, '');
      return parseFloat(s) || 0;
    } else {
      // coma como decimal, eliminar puntos de miles
      s = s.replace(/\./g, '').replace(',', '.');
      return parseFloat(s) || 0;
    }
  }

  if (hasComma) {
    const parts = s.split(',');
    // si la parte después de la coma tiene 3 dígitos, probablemente es separador de miles
    if (parts[1] && parts[1].length === 3) {
      s = s.replace(/,/g, '');
      return parseFloat(s) || 0;
    }
    // sino, asumir coma decimal
    s = s.replace(',', '.');
    return parseFloat(s) || 0;
  }

  if (hasDot) {
    const parts = s.split('.');
    if (parts[1] && parts[1].length === 3) {
      // punto como separador de miles
      s = s.replace(/\./g, '');
      return parseFloat(s) || 0;
    }
    return parseFloat(s) || 0;
  }

  return parseFloat(s) || 0;
}


function proceedToCheckout() {
  fetch('http://localhost:3000/carrito', { credentials: 'include' })
    .then(res => res.json().catch(() => ({ success: false, items: [] })))
    .then(async data => {

      let items = (data && data.success && Array.isArray(data.items)) ? data.items : [];

      try {
        items = mergeServerAndLocal(items);
      } catch (e) {
        if (!items || items.length === 0) {
          try {
            const local = getCart() || [];
            if (local && local.length > 0) items = local;
          } catch (err) {}
        }
      }

      if (!items || items.length === 0) {
        showNotification('Tu carrito está vacío o no se pudo cargar.', 'warning');
        return;
      }

      const checkoutModal = document.getElementById('checkout-modal');
      const checkoutItems = document.getElementById('checkout-items');
      const checkoutTotal = document.getElementById('checkout-total');

      let html = '';
      let total = 0;

      items.forEach(item => {
        const qty = Number(item.cantidad || item.quantity || 0);
        const price = parseNumberString(item.precio_unitario || item.precio || item.price || item.price_unitario || 0);
        const itemTotal = price * qty;
        total += itemTotal;

        html += `
          <div class="checkout-item">
            <p><strong>${item.titulo || item.title}</strong> x${qty}</p>
            <p>$${itemTotal.toLocaleString()}</p>
          </div>
        `;
      });

      checkoutItems.innerHTML = html;
      checkoutTotal.textContent = `$${total.toLocaleString()}`;

      // ===== 🔥 CUENTA BANCARIA + VALIDACIÓN =====
      try {
        const resp = await fetch('http://localhost:3000/cuenta-bancaria', {
          credentials: 'include'
        });

        const dataCuenta = await resp.json();
        const cuenta = dataCuenta && dataCuenta.success && dataCuenta.cuenta ? dataCuenta.cuenta : null;

        const paymentMethod = document.getElementById('checkout-payment-method');
        const cardFields = document.getElementById('credit-card-fields');
        const confirmBtn = document.querySelector('.modal-footer .btn-primary');

        let resumen = document.getElementById('bank-summary-checkout');

        if (!resumen) {
          resumen = document.createElement('div');
          resumen.id = 'bank-summary-checkout';
          resumen.className = 'form-group';
          document.querySelector('.checkout-form').appendChild(resumen);
        }

        if (cuenta && cuenta.clabe) {

          // ✅ HAY CUENTA
          if (confirmBtn) confirmBtn.disabled = false;

          if (paymentMethod) paymentMethod.style.display = 'none';
          if (cardFields) cardFields.style.display = 'none';

          const ultimos = cuenta.clabe.slice(-4);

          resumen.innerHTML = `
            <div class="bank-checkout-box">
              <p class="bank-title">Método de pago</p>
              <p><strong>${cuenta.banco}</strong></p>
              <p>${cuenta.titular}</p>
              <p class="bank-account">**** ${ultimos}</p>
            </div>
          `;

        } else {

          // ❌ NO HAY CUENTA
          if (confirmBtn) confirmBtn.disabled = true;

          if (paymentMethod) paymentMethod.style.display = '';
          if (cardFields) cardFields.style.display = '';

          resumen.innerHTML = `
            <p style="color:#D80032; font-weight:600; text-align:center;">
              Debes agregar una cuenta bancaria para continuar ❌
            </p>
          `;
        }

      } catch (e) {
        console.error("Error cuenta bancaria:", e);
      }

      // ===== DATOS USUARIO =====
      try {
        const user = JSON.parse(localStorage.getItem('userSession')) || {};

        document.getElementById('checkout-name').value = user.nombre || '';
        document.getElementById('checkout-email').value = user.correo || '';
        document.getElementById('checkout-phone').value = user.celular || '';
        document.getElementById('checkout-address').value = user.direccion || '';
      } catch (e) {}

      // ===== MOSTRAR MODAL =====
      checkoutModal.style.display = 'flex';
    })
    .catch(err => {
      console.error('Error al obtener carrito para checkout:', err);
      showNotification('Hubo un error al cargar el carrito.', 'warning');
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
    .then(res => res.json().catch(() => ({ success: false, items: [] })))
    .then(data => {
      let items = (data && data.success && Array.isArray(data.items)) ? data.items : []
      // Asegurar que incluimos también items locales no sincronizados
      try {
        items = mergeServerAndLocal(items)
      } catch (e) {
        if (!items || items.length === 0) {
          try { items = getCart() || [] } catch (err) { items = [] }
        }
      }

      if (!items || items.length === 0) {
        try { showNotification("Tu carrito está vacío. Agrega libros antes de confirmar el pedido.", 'warning') } catch (e) { console.warn('Tu carrito está vacío. Agrega libros antes de confirmar el pedido.') }
        return;
      }

      return fetch("http://localhost:3000/pedidos", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items,
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

        // Limpiar el carrito local
        try { localStorage.removeItem('bookCart'); } catch (e) { /* ignore */ }

        // Limpiar el carrito en el backend
        fetch("http://localhost:3000/carrito/limpiar", {
          method: "DELETE",
          credentials: "include"
        }).then(() => {
          setTimeout(() => {
            loadCart();
            loadOrders();
          }, 500);
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




// ============MIS PEDIDOS=================

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



// ===== CARGA LOS PEDIDOS =====
let todosLosPedidos = []; // guardamos todos para filtrar
let paginaActual = 1;
const PEDIDOS_POR_PAGINA = 4;

function loadOrders() {
  const ordersItems = document.getElementById("orders-items");

  ordersItems.innerHTML = `
    <div class="loading-state">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Cargando tus pedidos...</p>
    </div>
  `;

  fetch("/mis-pedidos", { credentials: "include" })
    .then(res => res.json())
    .then(data => {
      if (!data.success || !data.pedidos.length) {
        ordersItems.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-box"></i>
            <h3>No tienes pedidos</h3>
          </div>
        `;
        return;
      }

      todosLosPedidos = data.pedidos;
      paginaActual = 1;
      renderPedidos(todosLosPedidos);
    })
    .catch(err => {
      console.error(err);
      ordersItems.innerHTML = `<div class="error-state"><p>Error al cargar pedidos</p></div>`;
    });
}

// ===== FILTRAR POR BUSCADOR =====
function filterOrders() {
  const query = document.getElementById("searchOrdersInput").value.toLowerCase().trim();

  const filtrados = todosLosPedidos.filter(order => {
    // buscar por ID
    const porId = String(order.id_pedido).includes(query);
    
    // buscar por estado
    const porEstado = (order.estado || '').toLowerCase().includes(query);
    
    // buscar por nombre de libro
    const porLibro = order.libros.some(libro =>
      (libro.titulo || '').toLowerCase().includes(query)
    );

    return porId || porEstado || porLibro;
  });

  paginaActual = 1;
  renderPedidos(filtrados);
}

// ===== RENDERIZA CON PAGINACIÓN =====
function renderPedidos(pedidos) {
  const ordersItems = document.getElementById("orders-items");
  ordersItems.innerHTML = "";

  if (pedidos.length === 0) {
    ordersItems.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-search"></i>
        <h3>No se encontraron pedidos</h3>
      </div>
    `;
    return;
  }

  const totalPaginas = Math.ceil(pedidos.length / PEDIDOS_POR_PAGINA);
  const inicio = (paginaActual - 1) * PEDIDOS_POR_PAGINA;
  const pedidosPagina = pedidos.slice(inicio, inicio + PEDIDOS_POR_PAGINA);

  let html = "";

  pedidosPagina.forEach(order => {
    let statusText = "";
    let statusClass = "";

    switch (order.estado) {
      case "pendiente":   statusText = "⏳ Pendiente";  statusClass = "status-pending";    break;
      case "procesando":  statusText = "👨‍🍳 Procesando"; statusClass = "status-processing"; break;
      case "enviado":     statusText = "🚚 Enviado";    statusClass = "status-shipped";    break;
      case "entregado":   statusText = "✅ Entregado";  statusClass = "status-delivered";  break;
      case "cancelado":   statusText = "❌ Cancelado";  statusClass = "status-cancelled";  break;
      default:            statusText = order.estado;    statusClass = "status-default";
    }

    const itemCount = order.libros.reduce((sum, libro) => sum + libro.cantidad, 0);

    const librosHtml = order.libros.map(libro => `
      <li>${libro.titulo || "Libro sin nombre"} (x${libro.cantidad})</li>
    `).join("");

    html += `
  <div class="order-card">
    <div class="order-header">
      <div>
        <div class="order-number">Pedido #${order.id_pedido}</div>
        <div style="color:#666; font-size:0.9rem">${new Date(order.fecha_creacion).toLocaleDateString()}</div>
      </div>
      <div class="order-status ${statusClass}">${statusText}</div>
    </div>

    <div class="order-items">
      <div class="order-items-info">
        <div><strong>Artículos:</strong> ${itemCount} | <strong>Total:</strong> $${order.total.toLocaleString()}</div>
        <ul>${librosHtml}</ul>
      </div>
      <button class="btn-primary btn-small" onclick="generarFacturaPedido(${order.id_pedido})">
        📄 Generar factura
      </button>
    </div>
  </div>
`;
  });

  // PAGINACIÓN
  if (totalPaginas > 1) {
    html += `<div class="pagination">`;

    html += `<button 
      onclick="cambiarPagina(${paginaActual - 1}, this)" 
      ${paginaActual === 1 ? 'disabled' : ''}>
      ← Anterior
    </button>`;

    for (let i = 1; i <= totalPaginas; i++) {
      html += `<button 
        onclick="cambiarPagina(${i}, this)"
        class="${i === paginaActual ? 'active' : ''}">
        ${i}
      </button>`;
    }

    html += `<button 
      onclick="cambiarPagina(${paginaActual + 1}, this)"
      ${paginaActual === totalPaginas ? 'disabled' : ''}>
      Siguiente →
    </button>`;

    html += `</div>`;
  }

  ordersItems.innerHTML = html;
}

// ===== CAMBIAR PÁGINA =====
function cambiarPagina(nuevaPagina) {
  const query = document.getElementById("searchOrdersInput").value.toLowerCase().trim();
  const filtrados = todosLosPedidos.filter(order =>
    String(order.id_pedido).includes(query) ||
    (order.estado || '').toLowerCase().includes(query)
  );

  const totalPaginas = Math.ceil(filtrados.length / PEDIDOS_POR_PAGINA);
  if (nuevaPagina < 1 || nuevaPagina > totalPaginas) return;

  paginaActual = nuevaPagina;
  renderPedidos(filtrados);
}




// =====funcon de genea factra

function generarFacturaPedido(idPedido) {
  const a = document.createElement('a');
  a.href = `/mis-pedidos/${idPedido}/factura`;
  a.download = `factura-pedido-${idPedido}.pdf`;
  a.click();
}










// ========= FAVORITES FUNCTIONALITY =====

function saveBook(bookId) {
  // Compatibilidad: usar getFavorites/saveFavorites para mantener formato unificado
  try {
    let favorites = getFavorites() || []
    if (favorites.some(f => String(f.id) === String(bookId))) {
      try { showToast("📚 Este libro ya está en tus favoritos", 'info') } catch (e) { alert("📚 Este libro ya está en tus favoritos") }
      return
    }
    favorites.push({ id: bookId })
    saveFavorites(favorites)
    try { showToast("❤️ Libro guardado en favoritos", 'success') } catch (e) { alert("❤️ Libro guardado en favoritos") }
  } catch (e) {
    console.warn('legacy saveBook fallback failed', e)
    try { showToast("No se pudo guardar el favorito", 'error') } catch (e) { /* ignore */ }
  }
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
          : parseNumberString(book.price);

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
  const favorites = getFavorites() || [];
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
  const bookFavRaw = localStorage.getItem("bookFavorites")
  const favRaw = localStorage.getItem("favorites")
  const out = []
  try {
    if (bookFavRaw) {
      const parsed = JSON.parse(bookFavRaw)
      if (Array.isArray(parsed)) {
        parsed.forEach(item => {
          if (typeof item === 'string') out.push({ id: item })
          else if (item && item.id) out.push(item)
        })
      }
    }
  } catch (e) { console.warn('getFavorites parse bookFavorites failed', e) }

  try {
    if (favRaw) {
      const parsed2 = JSON.parse(favRaw)
      if (Array.isArray(parsed2)) {
        parsed2.forEach(item => {
          if (typeof item === 'string') {
            if (!out.some(x => String(x.id) === String(item))) out.push({ id: item })
          } else if (item && item.id) {
            if (!out.some(x => String(x.id) === String(item.id))) out.push(item)
          }
        })
      }
    }
  } catch (e) { console.warn('getFavorites parse favorites failed', e) }

  return out
}

function saveFavorites(favorites) {
  try {
    localStorage.setItem("bookFavorites", JSON.stringify(favorites))
    // also keep legacy key in sync to avoid mismatches in older code
    localStorage.setItem("favorites", JSON.stringify(favorites.map(f => f.id || f)))
  } catch (e) { console.warn('saveFavorites failed to write localStorage', e) }
  updateAllCounts()
  renderFavorites()
}



async function addToCartFromFavorites(bookId, title, authors, price, imageUrl) {
  const parsedPrice = parseNumberString(price)

  // Comprobar primero si ya está en el carrito en el servidor
  try {
    console.debug('[addToCartFromFavorites] payload:', { libro_id_api: bookId, titulo: title, precio_unitario: parsedPrice })
    const checkRes = await fetch('http://localhost:3000/carrito', { credentials: 'include' })
    const checkData = await checkRes.json().catch(() => ({ success: false }))
    console.debug('[addToCartFromFavorites] server check response:', checkData)
    if (checkData && checkData.success && Array.isArray(checkData.items)) {
      const exists = checkData.items.some(it => String(it.libro_id_api || it.id) === String(bookId))
      if (exists) {
        try { showNotification(`"${title}" ya está en el carrito`, 'error') } catch (e) { /* ignore */ }
        return
      }
    }
  } catch (e) {
    // ignore and fallback to local check below
  }

  // Comprobar carrito local como fallback
  try {
    const raw = localStorage.getItem('bookCart')
    const cartLocal = raw ? JSON.parse(raw) : []
    console.debug('[addToCartFromFavorites] local cart before add check:', cartLocal)
    const existsLocal = cartLocal.some(it => String(it.id) === String(bookId) || String(it.libro_id_api) === String(bookId))
    if (existsLocal) {
      try { showNotification(`"${title}" ya está en el carrito`, 'error') } catch (e) { /* ignore */ }
      return
    }
  } catch (e) {
    // ignore parse errors
  }

  // Intentar agregar en el servidor
  try {
    const resp = await fetch('http://localhost:3000/carrito/agregar', {
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
    const data = await resp.json().catch(() => ({ success: false }))
    if (data && data.success) {
      showNotification(`"${title}" añadido al carrito`, 'success')
      if (typeof loadCart === 'function') { try { loadCart() } catch (e) { /* ignore */ } }
      try { updateAllCounts() } catch (e) { /* ignore */ }
      return
    }
  } catch (err) {
    console.warn('Error agregando al carrito en el servidor, usando localStorage:', err)
  }

  // Fallback local
  try {
    const cart = getCart()
    const existingIndex = cart.findIndex((book) => String(book.id) === String(bookId) || String(book.libro_id_api) === String(bookId))
    if (existingIndex !== -1) {
      try { showNotification('Este libro ya está en el carrito', 'error') } catch (e) { /* ignore */ }
      return
    }

    const newBook = {
      id: bookId,
      title,
      author: authors,
      price: parsedPrice,
      image: imageUrl,
      quantity: 1,
    }

    cart.push(newBook)
    saveCart(cart)
    showNotification(`"${title}" añadido al carrito`, 'success')
    try { updateAllCounts() } catch (e) { /* ignore */ }
  } catch (e) {
    console.error('Error al agregar favorito al carrito (fallback):', e)
    try { showNotification('No se pudo agregar el libro al carrito', 'warning') } catch (e) { /* ignore */ }
  }
}

// Quitar favorito por índice
function removeFromFavorites(index) {
  try {
    const favorites = getFavorites()
    const removedBook = favorites[index]
    favorites.splice(index, 1)
    saveFavorites(favorites)
    showNotification(`"${removedBook?.title || removedBook?.titulo || ''}" eliminado de favoritos`, "info")
  } catch (e) {
    console.warn('removeFromFavorites failed', e)
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

// Sincronizar items locales pendientes al servidor (intenta subir solo los que no existan en servidor)
async function syncLocalCartToServer() {
  try {
    const local = getCart() || []
    if (!local || local.length === 0) return

    // Obtener items del servidor para evitar duplicados
    let serverItems = []
    try {
      const res = await fetch('http://localhost:3000/carrito', { credentials: 'include' })
      const data = await res.json().catch(() => ({ success: false }))
      if (data && data.success && Array.isArray(data.items)) serverItems = data.items
      else return // si no hay sesión/autorización, no intentamos sincronizar
    } catch (e) {
      // No podemos comunicarnos con el servidor ahora
      return
    }

    const serverIds = new Set(serverItems.map(it => String(it.libro_id_api || it.id || it.titulo)))

    // Filtrar los que no están en servidor
    const toSync = local.filter(it => !serverIds.has(String(it.libro_id_api || it.id || it.titulo)))
    if (toSync.length === 0) return

    let cart = local.slice()

    for (const item of toSync) {
      try {
        const payload = {
          libro_id_api: item.libro_id_api || item.id || item.titulo || '',
          titulo: item.titulo || item.title || '',
          cantidad: Number(item.cantidad || item.quantity || 1),
          precio_unitario: parseNumberString(item.precio_unitario || item.precio || item.price || 0),
          imagen: item.imagen || item.image || item.imageUrl || ''
        }

        const resp = await fetch('http://localhost:3000/carrito/agregar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload)
        })

        const data = await resp.json().catch(() => ({ success: false }))
        if (data && data.success) {
          // remover item sincronizado del local cart
          const idx = cart.findIndex(it => String(it.libro_id_api || it.id || it.titulo) === String(payload.libro_id_api))
          if (idx !== -1) cart.splice(idx, 1)
        } else {
          // si el servidor responde que ya existe, también eliminar local para evitar duplicados
          if (data && data.message && /ya está/i.test(String(data.message))) {
            const idx = cart.findIndex(it => String(it.libro_id_api || it.id || it.titulo) === String(payload.libro_id_api))
            if (idx !== -1) cart.splice(idx, 1)
          }
        }
      } catch (e) {
        console.warn('syncLocalCartToServer item failed', e)
        // dejar el item en local y continuar con los demás
      }
    }

    // Guardar cart residual local (los que no pudieron sincronizar)
    try { localStorage.setItem('bookCart', JSON.stringify(cart || [])) } catch (e) { console.warn('syncLocalCartToServer save failed', e) }
    // Actualizar vistas
    try { updateAllCounts() } catch (e) { /* ignore */ }
    try { if (typeof loadCart === 'function') loadCart() } catch (e) { /* ignore */ }
  } catch (err) {
    console.error('syncLocalCartToServer failed', err)
  }
}

// Obtener carrito desde localStorage con fallback seguro
function getCart() {
  try {
    const raw = localStorage.getItem('bookCart')
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!parsed) return []
    // Si es un objeto con `items`, devolver ese array
    if (Array.isArray(parsed)) return parsed
    if (parsed.items && Array.isArray(parsed.items)) return parsed.items
    return []
  } catch (e) {
    console.warn('getCart parse failed', e)
    return []
  }
}

function saveOrder(order) {
  const orders = getOrders()
  orders.unshift(order) // Add to beginning of array
  localStorage.setItem("bookOrders", JSON.stringify(orders))
  updateAllCounts()
  renderOrders()
}

// Recuperar pedidos desde localStorage (compatibilidad con keys legacy)
function getOrders() {
  try {
    const raw = localStorage.getItem('bookOrders') || localStorage.getItem('orders')
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed
    // Si es un objeto con `pedidos` o `items`, intentar devolver ese array
    if (parsed && Array.isArray(parsed.pedidos)) return parsed.pedidos
    if (parsed && Array.isArray(parsed.items)) return parsed.items
    return []
  } catch (e) {
    console.warn('getOrders parse failed', e)
    return []
  }
}

// Wrapper seguro para renderOrders, delega a loadOrders si existe
function renderOrders() {
  if (typeof loadOrders === 'function') {
    try { loadOrders(); return; } catch (e) { console.warn('renderOrders -> loadOrders failed', e) }
  }
  // Si no hay loadOrders, intentar usar una función admin/global si existe
  if (typeof window.renderOrders === 'function' && window.renderOrders !== renderOrders) {
    try { window.renderOrders(getOrders()); return } catch (e) { console.warn('fallback renderOrders failed', e) }
  }
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
  if (!notification || !notificationText) return

  // Reset classes and inline styles
  notification.className = "notification"
  notification.style.background = ''
  notification.style.color = ''

  // Add type class for CSS-based styling when available
  notification.classList.add(`notification-${type}`)

  // If caller requests explicit error styling, ensure red background
  if (type === 'error') {
    notification.style.background = '#f44336'
    notification.style.color = '#fff'
  } else if (type === 'warning') {
    notification.style.background = '#ff9800'
    notification.style.color = '#fff'
  } else if (type === 'info') {
    notification.style.background = '#2196f3'
    notification.style.color = '#fff'
  }

  notificationText.textContent = message
  notification.classList.add("show")

  setTimeout(() => {
    try { notification.classList.remove("show") } catch (e) { /* ignore */ }
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


// ===== DEBUG HELPERS =====
// Función útil para depurar diferencias entre carrito local, carrito servidor y favoritos.
// Úsala desde la consola del navegador con `dumpCartAndFavorites()` o provoca desde UI.
async function dumpCartAndFavorites() {
  try {
    console.group('dumpCartAndFavorites')
    const localCartRaw = localStorage.getItem('bookCart')
    const localFavoritesRaw = localStorage.getItem('bookFavorites') || localStorage.getItem('favorites')
    let localCart = []
    let localFavorites = []
    try { localCart = localCartRaw ? JSON.parse(localCartRaw) : [] } catch (e) { console.warn('parse localCart failed', e) }
    try { localFavorites = localFavoritesRaw ? JSON.parse(localFavoritesRaw) : [] } catch (e) { console.warn('parse localFavorites failed', e) }

    let serverCart = { success: false, items: [] }
    try {
      const res = await fetch('http://localhost:3000/carrito', { credentials: 'include' })
      serverCart = await res.json().catch(() => ({ success: false, items: [] }))
    } catch (e) {
      console.warn('fetch server carrito failed', e)
    }

    console.log('Server cart:', serverCart)
    console.log('Local cart:', localCart)
    console.log('Favorites (bookFavorites/favorites):', localFavorites)
    console.groupEnd()

    // Mostrar overlay legible en la página para facilitar copia/pegado
    const existing = document.getElementById('debug-modal')
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing)

    const wrapper = document.createElement('div')
    wrapper.id = 'debug-modal'
    wrapper.style.position = 'fixed'
    wrapper.style.left = '8px'
    wrapper.style.top = '8px'
    wrapper.style.right = '8px'
    wrapper.style.bottom = '8px'
    wrapper.style.background = 'rgba(0,0,0,0.8)'
    wrapper.style.color = '#fff'
    wrapper.style.zIndex = 99999
    wrapper.style.padding = '18px'
    wrapper.style.overflow = 'auto'
    wrapper.style.fontFamily = 'monospace'

    const closeBtn = document.createElement('button')
    closeBtn.textContent = 'Cerrar'
    closeBtn.style.position = 'absolute'
    closeBtn.style.right = '18px'
    closeBtn.style.top = '18px'
    closeBtn.style.padding = '6px 10px'
    closeBtn.style.cursor = 'pointer'
    closeBtn.onclick = () => { try { wrapper.remove() } catch (e) { /* ignore */ } }

    const pre = document.createElement('pre')
    pre.style.whiteSpace = 'pre-wrap'
    pre.style.color = '#fff'
    pre.textContent = JSON.stringify({ serverCart, localCart, localFavorites }, null, 2)

    wrapper.appendChild(closeBtn)
    wrapper.appendChild(pre)
    document.body.appendChild(wrapper)

    return { serverCart, localCart, localFavorites }
  } catch (err) {
    console.error('dumpCartAndFavorites error', err)
    return null
  }
}

// Hacerla accesible globalmente para llamada rápida desde consola
window.dumpCartAndFavorites = dumpCartAndFavorites

