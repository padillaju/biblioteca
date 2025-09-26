// ===== INITIALIZATION =====
document.addEventListener("DOMContentLoaded", () => {
  loadUserProfile()
  updateAllCounts()
  renderCart()
  renderFavorites()
  renderOrders()
  showTab("cart") // Show cart tab by default
})

// ===== NAVIGATION =====
function goToHome() {
  window.location.href = "Inicio.html"
}

function showTab(tabName) {
  document.querySelectorAll(".tab-pane").forEach((pane) => {
    pane.classList.remove("active")
  })

  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.remove("active")
  })

  document.getElementById(`${tabName}-tab`).classList.add("active")

  // Add active class to clicked tab button
  event.target.classList.add("active")

  switch (tabName) {
    case "cart":
      renderCart()
      break
    case "favorites":
      renderFavorites()
      break
    case "orders":
      renderOrders()
      break
    case "profile":
      loadProfileForm()
      break
  }
}

// ===== perfil =====
function loadUserProfile() {
  const user = JSON.parse(localStorage.getItem("userSession"))
  document.getElementById("profile-name").textContent = user?.nombre || "Usuario Invitado"
  document.getElementById("profile-email").textContent = user?.email || "Inicia sesión para más funciones"
  document.getElementById("profile-phone").textContent = user?.telefono ? `Teléfono: ${user.telefono}` : ""
  document.getElementById("profile-address").textContent = user?.direccion ? `Dirección: ${user.direccion}` : ""
}

function loadProfileForm() {
  const user = JSON.parse(localStorage.getItem("userSession")) || {}

  document.getElementById("profile-name-input").value = user.nombre || ""
  document.getElementById("profile-email-input").value = user.email || ""
  document.getElementById("profile-phone-input").value = user.telefono || ""
  document.getElementById("profile-address-input").value = user.direccion || ""
}

function saveProfile() {
  const profileData = {
    nombre: document.getElementById("profile-name-input").value,
    email: document.getElementById("profile-email-input").value,
    telefono: document.getElementById("profile-phone-input").value,
    direccion: document.getElementById("profile-address-input").value,
    avatar: "https://via.placeholder.com/100x100?text=User",
  }

  if (!profileData.nombre || !profileData.email) {
    showNotification("Por favor completa al menos el nombre y email", "warning")
    return
  }

  localStorage.setItem("userSession", JSON.stringify(profileData))
  loadUserProfile()
  showNotification("Perfil actualizado correctamente", "success")
}

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
  if (confirm("¿Estás seguro de que quieres cerrar sesión?")) {
    localStorage.removeItem("userSession")
    showNotification("Sesión cerrada correctamente", "info")
    setTimeout(() => {
      goToHome()
    }, 1500)
  }
}

// ===== CART FUNCTIONALITY =====
function getCart() {
  const cart = localStorage.getItem("bookCart")
  return cart ? JSON.parse(cart) : []
}

function saveCart(cart) {
  localStorage.setItem("bookCart", JSON.stringify(cart))
  updateAllCounts()
  renderCart()
}

function renderCart() {
  const cart = getCart()
  const cartItems = document.getElementById("cart-items")
  const cartSummary = document.getElementById("cart-summary")
  const clearCartBtn = document.getElementById("clear-cart-btn")

  if (cart.length === 0) {
    cartItems.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-shopping-cart"></i>
                <h3>Tu carrito está vacío</h3>
                <p>Explora nuestros libros y añade algunos a tu carrito</p>
                <button class="btn-primary" onclick="goToHome()">Explorar Libros</button>
            </div>
        `
    cartSummary.style.display = "none"
    clearCartBtn.style.display = "none"
  } else {
    clearCartBtn.style.display = "block"
    cartSummary.style.display = "block"

    let html = ""
    let subtotal = 0

    cart.forEach((book, index) => {
      const price =
        typeof book.price === "number" ? book.price : Number.parseFloat(book.price.replace(/[^0-9.-]+/g, "")) || 0
      const itemTotal = price * book.quantity
      subtotal += itemTotal

      html += `
                <div class="item-card">
                    <div class="item-header">
                        <img src="${book.image || book.imageUrl}" alt="${book.title}" class="item-image">
                        <div class="item-info">
                            <h3 class="item-title">${book.title}</h3>
                            <p class="item-author">por ${book.author || book.authors}</p>
                            <p class="item-price">$${price.toLocaleString()} c/u</p>
                        </div>
                    </div>
                    <div class="quantity-controls">
                        <button class="quantity-btn" onclick="updateQuantity(${index}, -1)">-</button>
                        <span class="quantity">${book.quantity}</span>
                        <button class="quantity-btn" onclick="updateQuantity(${index}, 1)">+</button>
                    </div>
                    <div class="item-actions">
                        <div style="font-weight: bold; color: #667eea;">Total: $${itemTotal.toLocaleString()}</div>
                        <button class="btn-danger btn-small" onclick="removeFromCart(${index})">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    </div>
                </div>
            `
    })

    cartItems.innerHTML = html

    // Update summary
    const shipping = subtotal >= 50000 ? 0 : 5000
    const total = subtotal + shipping

    document.getElementById("cart-subtotal").textContent = `$${subtotal.toLocaleString()}`
    document.getElementById("cart-shipping").textContent = shipping === 0 ? "Gratis" : `$${shipping.toLocaleString()}`
    document.getElementById("cart-total").textContent = `$${total.toLocaleString()}`
  }
}

function updateQuantity(index, change) {
  const cart = getCart()
  if (cart[index]) {
    cart[index].quantity += change
    if (cart[index].quantity <= 0) {
      cart.splice(index, 1)
    }
    saveCart(cart)
  }
}

function removeFromCart(index) {
  const cart = getCart()
  const removedBook = cart[index]
  cart.splice(index, 1)
  saveCart(cart)
  showNotification(`"${removedBook.title}" eliminado del carrito`, "info")
}

function clearCart() {
  if (confirm("¿Estás seguro de vaciar el carrito?")) {
    localStorage.removeItem("bookCart")
    updateAllCounts()
    renderCart()
    showNotification("Carrito vaciado", "info")
  }
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

function renderFavorites() {
  const favorites = getFavorites()
  const favoritesItems = document.getElementById("favorites-items")
  const clearFavoritesBtn = document.getElementById("clear-favorites-btn")

  if (favorites.length === 0) {
    favoritesItems.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-heart"></i>
                <h3>No tienes favoritos</h3>
                <p>Guarda libros que te interesen para encontrarlos fácilmente</p>
                <button class="btn-primary" onclick="goToHome()">Explorar Libros</button>
            </div>
        `
    clearFavoritesBtn.style.display = "none"
  } else {
    clearFavoritesBtn.style.display = "block"

    let html = ""
    favorites.forEach((book, index) => {
      const price =
        typeof book.price === "number" ? book.price : Number.parseFloat(book.price.replace(/[^0-9.-]+/g, "")) || 0

      html += `
                <div class="item-card">
                    <div class="item-header">
                        <img src="${book.image || book.imageUrl}" alt="${book.title}" class="item-image">
                        <div class="item-info">
                            <h3 class="item-title">${book.title}</h3>
                            <p class="item-author">por ${book.author || book.authors}</p>
                            <p class="item-price">$${price.toLocaleString()}</p>
                        </div>
                    </div>
                    <div class="item-actions">
                        <button class="btn-primary btn-small" onclick="addToCartFromFavorites('${book.id}', '${book.title.replace(/'/g, "\\'")}', '${(book.author || book.authors).replace(/'/g, "\\'")}', '${price}', '${book.image || book.imageUrl}')">
                            <i class="fas fa-shopping-cart"></i> Al Carrito
                        </button>
                        <button class="btn-danger btn-small" onclick="removeFromFavorites(${index})">
                            <i class="fas fa-heart-broken"></i> Quitar
                        </button>
                    </div>
                </div>
            `
    })

    favoritesItems.innerHTML = html
  }
}

function addToCartFromFavorites(bookId, title, authors, price, imageUrl) {
  const newBook = {
    id: bookId,
    title,
    author: authors,
    price: Number.parseFloat(price) || 0,
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

function removeFromFavorites(index) {
  const favorites = getFavorites()
  const removedBook = favorites[index]
  favorites.splice(index, 1)
  saveFavorites(favorites)
  showNotification(`"${removedBook.title}" eliminado de favoritos`, "info")
}

function clearFavorites() {
  if (confirm("¿Estás seguro de limpiar todos los favoritos?")) {
    localStorage.removeItem("bookFavorites")
    updateAllCounts()
    renderFavorites()
    showNotification("Favoritos limpiados", "info")
  }
}

// ===== ORDERS FUNCTIONALITY =====
function getOrders() {
  const orders = localStorage.getItem("bookOrders")
  return orders ? JSON.parse(orders) : []
}

function saveOrder(order) {
  const orders = getOrders()
  orders.unshift(order) // Add to beginning of array
  localStorage.setItem("bookOrders", JSON.stringify(orders))
  updateAllCounts()
  renderOrders()
}

function renderOrders() {
  const orders = getOrders()
  const ordersItems = document.getElementById("orders-items")

  if (orders.length === 0) {
    ordersItems.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-box"></i>
                <h3>No tienes pedidos</h3>
                <p>Tus pedidos aparecerán aquí una vez que realices una compra</p>
                <button class="btn-primary" onclick="goToHome()">Explorar Libros</button>
            </div>
        `
  } else {
    let html = ""
    orders.forEach((order, index) => {
      const statusClass =
        order.status === "completed" ? "completed" : order.status === "pending" ? "pending" : "cancelled"
      const statusText =
        order.status === "completed" ? "Completado" : order.status === "pending" ? "Pendiente" : "Cancelado"

      html += `
                <div class="order-card">
                    <div class="order-header">
                        <div>
                            <div class="order-number">Pedido #${order.id}</div>
                            <div style="color: #666; font-size: 0.9rem;">${order.date}</div>
                        </div>
                        <div class="order-status ${statusClass}">${statusText}</div>
                    </div>
                    <div class="order-items">
                        <strong>Artículos:</strong> ${order.itemCount} | 
                        <strong>Total:</strong> $${order.total.toLocaleString()}
                    </div>
                    <div style="margin-top: 1rem;">
                        <strong>Entrega:</strong> ${order.customerInfo.name} - ${order.customerInfo.address}
                    </div>
                </div>
            `
    })

    ordersItems.innerHTML = html
  }
}

// ===== CHECKOUT FUNCTIONALITY =====
function proceedToCheckout() {
  const cart = getCart()
  if (cart.length === 0) {
    showNotification("Tu carrito está vacío", "warning")
    return
  }

  // Populate checkout modal
  let checkoutItemsHtml = ""
  let total = 0

  cart.forEach((book) => {
    const price =
      typeof book.price === "number" ? book.price : Number.parseFloat(book.price.replace(/[^0-9.-]+/g, "")) || 0
    const itemTotal = price * book.quantity
    total += itemTotal

    checkoutItemsHtml += `
            <div class="checkout-item">
                <span>${book.title} x${book.quantity}</span>
                <span>$${itemTotal.toLocaleString()}</span>
            </div>
        `
  })

  document.getElementById("checkout-items").innerHTML = checkoutItemsHtml
  document.getElementById("checkout-total").textContent = `$${total.toLocaleString()}`

  // Pre-fill with profile data if available
  const user = JSON.parse(localStorage.getItem("userSession"))
  if (user) {
    document.getElementById("checkout-name").value = user.nombre || ""
    document.getElementById("checkout-email").value = user.email || ""
    document.getElementById("checkout-phone").value = user.telefono || ""
    document.getElementById("checkout-address").value = user.direccion || ""
  }

  document.getElementById("checkout-modal").style.display = "block"
}

function closeCheckoutModal() {
  document.getElementById("checkout-modal").style.display = "none"
}

function confirmOrder() {
  const name = document.getElementById("checkout-name").value
  const email = document.getElementById("checkout-email").value
  const phone = document.getElementById("checkout-phone").value
  const address = document.getElementById("checkout-address").value

  if (!name || !email || !phone || !address) {
    showNotification("Por favor completa todos los campos", "warning")
    return
  }

  const cart = getCart()
  const total = cart.reduce((sum, item) => {
    const price =
      typeof item.price === "number" ? item.price : Number.parseFloat(item.price.replace(/[^0-9.-]+/g, "")) || 0
    return sum + price * item.quantity
  }, 0)

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  // Create order
  const order = {
    id: Date.now().toString(),
    date: new Date().toLocaleDateString(),
    items: cart,
    itemCount: itemCount,
    total: total,
    status: "completed",
    customerInfo: {
      name: name,
      email: email,
      phone: phone,
      address: address,
    },
  }

  // Save order and clear cart
  saveOrder(order)
  localStorage.removeItem("bookCart")
  updateAllCounts()
  renderCart()

  closeCheckoutModal()
  showNotification("¡Pedido realizado con éxito!", "success")

  // Switch to orders tab to show the new order
  setTimeout(() => {
    showTab("orders")
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      if (btn.textContent.includes("Mis Pedidos")) {
        btn.classList.add("active")
      } else {
        btn.classList.remove("active")
      }
    })
  }, 1500)
}

// ===== UTILITY FUNCTIONS =====
function updateAllCounts() {
  const cart = getCart()
  const favorites = getFavorites()
  const orders = getOrders()

  // Update header cart count
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0)
  const headerCartCount = document.getElementById("header-cart-count")
  if (headerCartCount) {
    headerCartCount.textContent = cartCount
  }

  // Update stats
  const cartStat = document.getElementById("cart-stat")
  const favoritesStat = document.getElementById("favorites-stat")
  const ordersStat = document.getElementById("orders-stat")

  if (cartStat) cartStat.textContent = cartCount
  if (favoritesStat) favoritesStat.textContent = favorites.length
  if (ordersStat) ordersStat.textContent = orders.length
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

// ===== EVENT LISTENERS =====
// Close modal when clicking outside
window.onclick = (event) => {
  const modal = document.getElementById("checkout-modal")
  if (event.target === modal) {
    closeCheckoutModal()
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

