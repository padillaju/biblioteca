// Variables globales - using same localStorage keys as main page
let cart = JSON.parse(localStorage.getItem("bookCart")) || []
let favorites = JSON.parse(localStorage.getItem("bookFavorites")) || []

// Inicializar la página
document.addEventListener("DOMContentLoaded", () => {
  updateCartDisplay()
  updateFavoritesDisplay()
  updateCounts()
})

// Funciones de navegación
function goBack() {
  window.location.href = "Inicio.html"
}

function showTab(tabName) {
  // Ocultar todas las pestañas
  document.querySelectorAll(".tab-content").forEach((tab) => {
    tab.classList.remove("active")
  })

  // Remover clase active de todos los botones
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.remove("active")
  })

  // Mostrar la pestaña seleccionada
  document.getElementById(tabName + "-tab").classList.add("active")

  // Activar el botón correspondiente
  event.target.classList.add("active")
}

// Funciones del carrito
function updateCartDisplay() {
  const cartItemsContainer = document.getElementById("cart-items")
  const emptyCart = document.getElementById("empty-cart")
  const cartSummary = document.getElementById("cart-summary")

  if (cart.length === 0) {
    cartItemsContainer.style.display = "none"
    emptyCart.style.display = "block"
    cartSummary.style.display = "none"
  } else {
    cartItemsContainer.style.display = "block"
    emptyCart.style.display = "none"
    cartSummary.style.display = "block"

    cartItemsContainer.innerHTML = cart
      .map(
        (item) => `
            <div class="cart-item">
                <img src="${item.image || item.imageUrl || "/placeholder.svg?height=120&width=80"}" alt="${item.title}" class="item-image">
                <div class="item-details">
                    <h3 class="item-title">${item.title}</h3>
                    <p class="item-author">por ${item.author || item.authors}</p>
                    <p class="item-price">$${(typeof item.price === "number" ? item.price : Number.parseFloat(item.price.replace(/[^0-9.-]+/g, "")) || 0).toLocaleString()}</p>
                    <div class="item-actions">
                        <div class="quantity-controls">
                            <button class="quantity-btn" onclick="decreaseQuantity('${item.id}')">-</button>
                            <span class="quantity-display">${item.quantity}</span>
                            <button class="quantity-btn" onclick="increaseQuantity('${item.id}')">+</button>
                        </div>
                        <button class="remove-btn" onclick="removeFromCart('${item.id}')">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    </div>
                </div>
            </div>
        `,
      )
      .join("")

    updateCartSummary()
  }
}

function updateCartSummary() {
  const subtotal = cart.reduce((total, item) => {
    const price =
      typeof item.price === "number" ? item.price : Number.parseFloat(item.price.replace(/[^0-9.-]+/g, "")) || 0
    return total + price * item.quantity
  }, 0)
  const shipping = subtotal > 50000 ? 0 : 5000
  const total = subtotal + shipping

  document.getElementById("subtotal").textContent = `$${subtotal.toLocaleString()}`
  document.getElementById("shipping").textContent = shipping === 0 ? "Gratis" : `$${shipping.toLocaleString()}`
  document.getElementById("total").textContent = `$${total.toLocaleString()}`
}

function increaseQuantity(bookId) {
  const item = cart.find((item) => item.id === bookId)
  if (item) {
    item.quantity++
    saveCart()
    updateCartDisplay()
    updateCounts()
    showNotification("Cantidad actualizada", "success")
  }
}

function decreaseQuantity(bookId) {
  const item = cart.find((item) => item.id === bookId)
  if (item && item.quantity > 1) {
    item.quantity--
    saveCart()
    updateCartDisplay()
    updateCounts()
    showNotification("Cantidad actualizada", "success")
  }
}

function removeFromCart(bookId) {
  cart = cart.filter((item) => item.id !== bookId)
  saveCart()
  updateCartDisplay()
  updateCounts()
  showNotification("Libro eliminado del carrito", "success")
}

function clearCart() {
  if (cart.length === 0) {
    showNotification("El carrito ya está vacío", "warning")
    return
  }

  if (confirm("¿Estás seguro de que quieres vaciar el carrito?")) {
    cart = []
    saveCart()
    updateCartDisplay()
    updateCounts()
    showNotification("Carrito vaciado", "success")
  }
}

function saveCart() {
  localStorage.setItem("bookCart", JSON.stringify(cart))
}

// Funciones de favoritos
function updateFavoritesDisplay() {
  const favoritesItemsContainer = document.getElementById("favorites-items")
  const emptyFavorites = document.getElementById("empty-favorites")
  const clearFavoritesBtn = document.getElementById("clear-favorites-btn")

  if (favorites.length === 0) {
    favoritesItemsContainer.style.display = "none"
    emptyFavorites.style.display = "block"
    clearFavoritesBtn.style.display = "none"
  } else {
    favoritesItemsContainer.style.display = "block"
    emptyFavorites.style.display = "none"
    clearFavoritesBtn.style.display = "block"

    favoritesItemsContainer.innerHTML = favorites
      .map(
        (item) => `
            <div class="favorite-item">
                <img src="${item.image || item.imageUrl || "/placeholder.svg?height=120&width=80"}" alt="${item.title}" class="item-image">
                <div class="item-details">
                    <h3 class="item-title">${item.title}</h3>
                    <p class="item-author">por ${item.author || item.authors}</p>
                    <p class="item-price">$${(typeof item.price === "number" ? item.price : Number.parseFloat(item.price.replace(/[^0-9.-]+/g, "")) || 0).toLocaleString()}</p>
                    <div class="item-actions">
                        <button class="add-to-cart-btn" onclick="addToCartFromFavorites('${item.id}')">
                            <i class="fas fa-shopping-cart"></i> Añadir al carrito
                        </button>
                        <button class="remove-btn" onclick="removeFromFavorites('${item.id}')">
                            <i class="fas fa-heart-broken"></i> Quitar
                        </button>
                    </div>
                </div>
            </div>
        `,
      )
      .join("")
  }
}

function addToCartFromFavorites(bookId) {
  const favoriteItem = favorites.find((item) => item.id === bookId)
  if (favoriteItem) {
    const existingCartItem = cart.find((item) => item.id === bookId)

    if (existingCartItem) {
      existingCartItem.quantity++
    } else {
      cart.push({
        ...favoriteItem,
        quantity: 1,
      })
    }

    saveCart()
    updateCartDisplay()
    updateCounts()
    showNotification("Libro añadido al carrito desde favoritos", "success")
  }
}

function removeFromFavorites(bookId) {
  favorites = favorites.filter((item) => item.id !== bookId)
  saveFavorites()
  updateFavoritesDisplay()
  updateCounts()
  showNotification("Libro eliminado de favoritos", "success")
}

function clearFavorites() {
  if (favorites.length === 0) {
    showNotification("No tienes favoritos para limpiar", "warning")
    return
  }

  if (confirm("¿Estás seguro de que quieres limpiar todos los favoritos?")) {
    favorites = []
    saveFavorites()
    updateFavoritesDisplay()
    updateCounts()
    showNotification("Favoritos limpiados", "success")
  }
}

function saveFavorites() {
  localStorage.setItem("bookFavorites", JSON.stringify(favorites))
}

// Funciones de checkout
function proceedToCheckout() {
  if (cart.length === 0) {
    showNotification("Tu carrito está vacío", "warning")
    return
  }

  const modal = document.getElementById("checkout-modal")
  const checkoutItems = document.getElementById("checkout-items")
  const checkoutTotal = document.getElementById("checkout-total")

  // Mostrar items en el modal
  checkoutItems.innerHTML = cart
    .map((item) => {
      const price =
        typeof item.price === "number" ? item.price : Number.parseFloat(item.price.replace(/[^0-9.-]+/g, "")) || 0
      return `
            <div class="checkout-item">
                <span>${item.title} (x${item.quantity})</span>
                <span>$${(price * item.quantity).toLocaleString()}</span>
            </div>
        `
    })
    .join("")

  // Calcular total
  const subtotal = cart.reduce((total, item) => {
    const price =
      typeof item.price === "number" ? item.price : Number.parseFloat(item.price.replace(/[^0-9.-]+/g, "")) || 0
    return total + price * item.quantity
  }, 0)
  const shipping = subtotal > 50000 ? 0 : 5000
  const total = subtotal + shipping

  checkoutTotal.textContent = total.toLocaleString()

  modal.style.display = "block"
}

function closeCheckoutModal() {
  document.getElementById("checkout-modal").style.display = "none"
  // Limpiar formulario
  document.getElementById("customer-name").value = ""
  document.getElementById("customer-email").value = ""
  document.getElementById("customer-address").value = ""
  document.getElementById("customer-phone").value = ""
}

function confirmOrder() {
  const name = document.getElementById("customer-name").value.trim()
  const email = document.getElementById("customer-email").value.trim()
  const address = document.getElementById("customer-address").value.trim()
  const phone = document.getElementById("customer-phone").value.trim()

  if (!name || !email || !address || !phone) {
    showNotification("Por favor completa todos los campos", "error")
    return
  }

  // Simular procesamiento del pedido
  showNotification("Procesando pedido...", "info")

  setTimeout(() => {
    // Limpiar carrito después del pedido
    cart = []
    saveCart()
    updateCartDisplay()
    updateCounts()

    closeCheckoutModal()
    showNotification("¡Pedido confirmado! Recibirás un email de confirmación.", "success")

    // Cambiar a la pestaña de carrito para mostrar que está vacío
    showTab("cart")
    document.querySelector(".tab-btn").click()
  }, 2000)
}

// Funciones de utilidad
function updateCounts() {
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0)
  const favoritesCount = favorites.length

  document.getElementById("cart-count").textContent = cartCount
  document.getElementById("favorites-count").textContent = favoritesCount
}

function showNotification(message, type = "success") {
  const notification = document.getElementById("notification")
  const notificationText = document.getElementById("notification-text")

  notificationText.textContent = message
  notification.className = `notification ${type}`
  notification.classList.add("show")

  setTimeout(() => {
    notification.classList.remove("show")
  }, 3000)
}

// Event listeners para cerrar modal al hacer clic fuera
window.onclick = (event) => {
  const modal = document.getElementById("checkout-modal")
  if (event.target === modal) {
    closeCheckoutModal()
  }
}
