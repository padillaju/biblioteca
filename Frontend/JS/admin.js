
async function cargarTotalUsuarios() {
  try {
    const res = await fetch("/api/usuario/cliente");
    const usuarios = await res.json();

    document.getElementById("totalUsers").textContent = usuarios.length;
  } catch (error) {
    console.error("Error al cargar total de usuarios:", error);
  }
}






// Función para obtener usuarios en el contradoe
async function actualizarTotalUsuarios() {
    try {
        const response = await fetch('http://localhost:3000/cliente');
        if (!response.ok) throw new Error('Error al obtener usuarios');

        const clientes = await response.json();

        // Actualizar el contador en el dashboard
        const totalUsersElement = document.getElementById('totalUsers');
        if (totalUsersElement) {
            totalUsersElement.textContent = clientes.length;
        } else {
            console.warn("No se encontró el elemento #totalUsers");
        }
    } catch (error) {
        console.error('Error al actualizar total de usuarios:', error);
    }
}


// Función para cargar usuarios en la tabla
async function cargarUsuarios() {
    try {
        const response = await fetch('http://localhost:3000/cliente'); // endpoint que devuelve clientes
        if (!response.ok) throw new Error('Error al obtener usuarios');

        const usuarios = await response.json();
        const tabla = document.getElementById('usersTable');

        tabla.innerHTML = ""; // limpiar tabla antes de llenarla

        usuarios.forEach(usuario => {
            const fila = document.createElement('tr');

            fila.innerHTML = `
                <td>${usuario.id_usuario}</td>
                <td>${usuario.nombre}</td>
                <td>${usuario.correo}</td>
                <td>${usuario.fecha_registro || '-'}</td>
                <td>${usuario.pedidos || 0}</td>
                <td>${usuario.estado || 'Activo'}</td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="eliminarUsuario(${usuario.id_usuario})">Eliminar</button>
                </td>
            `;

            tabla.appendChild(fila);
        });

    } catch (error) {
        console.error('Error al cargar usuarios:', error);
    }
}

// Ejecutar al cargar la página
window.addEventListener('DOMContentLoaded', () => {
    cargarUsuarios();
});



function eliminarUsuario(id) {
    if (!confirm("¿Estás seguro de eliminar este usuario?")) return;

    fetch(`http://localhost:3000/usuario/${id}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(data.message);
            cargarUsuarios(); 
        } else {
            alert('Error al eliminar usuario');
        }
    })
    .catch(error => console.error('Error al eliminar usuario:', error));
}




// Ejecutar al cargar la página
window.addEventListener('DOMContentLoaded', () => {
    actualizarTotalUsuarios();
});





// Llamar cuando se carga el dashboard
cargarTotalUsuarios();


// Verificación de sesión al cargar la página (protección contra navegación hacia atrás)
async function verifySessionOnLoad() {
    try {
        const response = await fetch("http://localhost:3000/check-session?" + Date.now(), {
            method: "GET",
            credentials: "include",
            cache: "no-store",
            headers: {
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0"
            }
        });
        
        const data = await response.json();
        
        // Verificar si el usuario es administrador
        const isAdmin = localStorage.getItem("isAdmin") === "true";
        
        // Si no hay sesión activa o no es administrador, redirigir inmediatamente
        if (!data.success || !data.isAuthenticated || !isAdmin) {
            // Limpiar localStorage
            localStorage.removeItem("userSession");
            localStorage.removeItem("isAdmin");
            
            // Redirigir al login sin permitir volver atrás
            window.history.replaceState(null, "", "login.html?session=expired&nocache=" + Date.now());
            window.location.replace("login.html?session=expired&nocache=" + Date.now());
            return false;
        }
        
        return true;
    } catch (error) {
        console.error("Error al verificar sesión:", error);
        // En caso de error, redirigir por seguridad
        window.history.replaceState(null, "", "login.html?error=connection&nocache=" + Date.now());
        window.location.replace("login.html?error=connection&nocache=" + Date.now());
        return false;
    }
}

// Prevenir navegación hacia atrás después del logout
function preventBackNavigation() {
    // Reemplazar el historial actual para que no se pueda volver atrás
    window.history.replaceState(null, "", window.location.href);
    
    // Agregar listener para detectar cuando el usuario intenta ir atrás
    window.addEventListener('popstate', function(event) {
        // Verificar sesión cuando se detecta navegación hacia atrás
        verifySessionOnLoad().then(isAuthenticated => {
            if (!isAuthenticated) {
                // Si no hay sesión, prevenir la navegación
                event.preventDefault();
                // Forzar redirección al login
                window.history.pushState(null, "", "login.html?back=prevented&nocache=" + Date.now());
                window.location.replace("login.html?back=prevented&nocache=" + Date.now());
            }
        });
        
        // Siempre verificar sesión cuando se detecta popstate
        fetch("http://localhost:3000/check-session?" + Date.now(), {
            method: "GET",
            credentials: "include",
            cache: "no-store"
        })
        .then(response => response.json())
        .then(data => {
            const isAdmin = localStorage.getItem("isAdmin") === "true";
            if (!data.success || !data.isAuthenticated || !isAdmin) {
                // Si no hay sesión o no es admin, redirigir inmediatamente
                window.history.pushState(null, "", "login.html?session=expired&nocache=" + Date.now());
                window.location.replace("login.html?session=expired&nocache=" + Date.now());
            }
        })
        .catch(error => {
            console.error("Error al verificar sesión en popstate:", error);
            window.location.replace("login.html?error=connection&nocache=" + Date.now());
        });
    });
    
    // Agregar entrada adicional al historial para prevenir navegación hacia atrás
    window.history.pushState(null, "", window.location.href);
}

// Inicialización del panel de administrador
document.addEventListener("DOMContentLoaded", async () => {
  // Verificar sesión ANTES de inicializar cualquier cosa
  const isAuthenticated = await verifySessionOnLoad();
  
  if (!isAuthenticated) {
    // Si no hay sesión, no continuar con la inicialización
    return;
  }
  
  // Prevenir navegación hacia atrás
  preventBackNavigation();
  
  initializeAdmin()
  loadDashboardData()
  setupEventListeners()
  
  // Verificación periódica de sesión (cada 30 segundos) para prevenir acceso después del logout
  setInterval(async () => {
    try {
      const response = await fetch("http://localhost:3000/check-session?" + Date.now(), {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0"
        }
      });
      
      const data = await response.json();
      const isAdmin = localStorage.getItem("isAdmin") === "true";
      
      // Si la sesión expiró o no es admin, redirigir inmediatamente
      if (!data.success || !data.isAuthenticated || !isAdmin) {
        localStorage.removeItem("userSession");
        localStorage.removeItem("isAdmin");
        window.history.replaceState(null, "", "login.html?session=expired&nocache=" + Date.now());
        window.location.replace("login.html?session=expired&nocache=" + Date.now());
      }
    } catch (error) {
      console.error("Error en verificación periódica de sesión:", error);
      // No redirigir en caso de error de conexión, solo loguear
    }
  }, 30000); // Verificar cada 30 segundos
})

function initializeAdmin() {
  // Verificar si el usuario es administrador (ya verificado en verifySessionOnLoad)
  const isAdmin = localStorage.getItem("isAdmin") === "true"
  if (!isAdmin) {
    // Redirigir al login si no es administrador
    window.history.replaceState(null, "", "login.html?admin=required&nocache=" + Date.now());
    window.location.replace("login.html?admin=required&nocache=" + Date.now());
    return
  }

  // Configurar navegación del sidebar
  setupSidebarNavigation()
}

function setupSidebarNavigation() {
  const navItems = document.querySelectorAll(".nav-item")
  const sections = document.querySelectorAll(".admin-section")

  navItems.forEach((item) => {
    item.addEventListener("click", () => {
      const targetSection = item.dataset.section

      // Remover clase active de todos los items y secciones
      navItems.forEach((nav) => nav.classList.remove("active"))
      sections.forEach((section) => section.classList.remove("active"))

      // Agregar clase active al item y sección seleccionados
      item.classList.add("active")
      document.getElementById(targetSection).classList.add("active")

      // Cargar datos específicos de la sección
      loadSectionData(targetSection)
    })
  })
}

function loadSectionData(section) {
  switch (section) {
    case "dashboard":
      loadDashboardData()
      break
    case "orders":
      loadOrdersData()
      break
    case "users":
      loadUsersData()
      break
    case "books":
      loadBooksData()
      break
    case "reports":
      loadReportsData()
      break
    case "settings":
      loadSettingsData()
      break
  }
}

function loadDashboardData() {
  // Calcular estadísticas
  const totalOrders = adminData.orders.length
  const totalUsers = adminData.users.length
  const totalRevenue = adminData.orders.reduce((sum, order) => sum + order.total, 0)
  const totalBooks = adminData.orders.reduce(
    (sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0,
  )

  // Actualizar elementos del DOM
  document.getElementById("totalOrders").textContent = totalOrders
  document.getElementById("totalUsers").textContent = totalUsers
  document.getElementById("totalRevenue").textContent = `$${totalRevenue.toLocaleString()}`
  document.getElementById("totalBooks").textContent = totalBooks

  // Cargar actividad reciente
  loadRecentActivity()
}

function loadRecentActivity() {
  const recentActivity = document.getElementById("recentActivity")
  const activities = [
    { icon: "fas fa-shopping-cart", text: "Nuevo pedido recibido", time: "Hace 5 min" },
    { icon: "fas fa-user-plus", text: "Nuevo usuario registrado", time: "Hace 15 min" },
    { icon: "fas fa-truck", text: "Pedido enviado", time: "Hace 1 hora" },
    { icon: "fas fa-star", text: "Nueva reseña recibida", time: "Hace 2 horas" },
  ]

  recentActivity.innerHTML = activities
    .map(
      (activity) => `
        <div class="activity-item">
            <div class="activity-icon">
                <i class="${activity.icon}"></i>
            </div>
            <div class="activity-info">
                <p>${activity.text}</p>
                <span class="activity-time">${activity.time}</span>
            </div>
        </div>
    `,
    )
    .join("")
}

function loadOrdersData() {
  const ordersTable = document.getElementById("ordersTable")
  const filter = document.getElementById("orderFilter").value

  let filteredOrders = adminData.orders
  if (filter !== "all") {
    filteredOrders = adminData.orders.filter((order) => order.status === filter)
  }

  ordersTable.innerHTML = filteredOrders
    .map(
      (order) => `
        <tr>
            <td>${order.id}</td>
            <td>${order.customer}</td>
            <td>${order.date}</td>
            <td>$${order.total.toLocaleString()}</td>
            <td><span class="status-badge status-${order.status}">${getStatusText(order.status)}</span></td>
            <td>
                <button class="btn-primary" onclick="viewOrderDetails('${order.id}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-secondary" onclick="updateOrderStatus('${order.id}')">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        </tr>
    `,
    )
    .join("")
}

function loadUsersData() {
  const usersTable = document.getElementById("usersTable")
  const searchTerm = document.getElementById("userSearch")?.value.toLowerCase() || ""

  let filteredUsers = adminData.users
  if (searchTerm) {
    filteredUsers = adminData.users.filter(
      (user) => user.name.toLowerCase().includes(searchTerm) || user.email.toLowerCase().includes(searchTerm),
    )
  }

  usersTable.innerHTML = filteredUsers
    .map(
      (user) => `
        <tr>
            <td>${user.id}</td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.registerDate}</td>
            <td>${user.orders}</td>
            <td><span class="status-badge status-${user.status}">${user.status}</span></td>
            <td>
                <button class="btn-secondary" onclick="editUser(${user.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-danger" onclick="toggleUserStatus(${user.id})">
                    <i class="fas fa-ban"></i>
                </button>
            </td>
        </tr>
    `,
    )
    .join("")
}

function loadBooksData() {
  const booksGrid = document.getElementById("featuredBooks")

  booksGrid.innerHTML = adminData.featuredBooks
    .map(
      (book) => `
        <div class="book-card">
            <img src="${book.image}" alt="${book.title}" class="book-image">
            <div class="book-info">
                <h4>${book.title}</h4>
                <p><strong>Autor:</strong> ${book.author}</p>
                <p>${book.description}</p>
                <div class="book-price">$${book.price.toLocaleString()}</div>
                <div class="book-actions">
                    <button class="btn-secondary" onclick="editBook(${book.id})">
                        <i class="fas fa-edit"></i>
                        Editar
                    </button>
                    <button class="btn-danger" onclick="deleteBook(${book.id})">
                        <i class="fas fa-trash"></i>
                        Eliminar
                    </button>
                </div>
            </div>
        </div>
    `,
    )
    .join("")
}

function loadReportsData() {
  loadTopBooks()
  loadUserAnalytics()
}

function loadTopBooks() {
  const topBooks = document.getElementById("topBooks")
  // Calcular libros más vendidos basado en pedidos
  const bookSales = {}

  adminData.orders.forEach((order) => {
    order.items.forEach((item) => {
      if (bookSales[item.title]) {
        bookSales[item.title] += item.quantity
      } else {
        bookSales[item.title] = item.quantity
      }
    })
  })

  const sortedBooks = Object.entries(bookSales)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  topBooks.innerHTML = sortedBooks
    .map(
      ([title, sales], index) => `
        <div class="top-book-item" style="padding: 1rem 0; border-bottom: 1px solid #eee;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong>${index + 1}. ${title}</strong>
                    <p style="margin: 0; color: #666; font-size: 0.9rem;">${sales} vendidos</p>
                </div>
                <div style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.8rem;">
                    ${sales}
                </div>
            </div>
        </div>
    `,
    )
    .join("")
}

function loadUserAnalytics() {
  const userAnalytics = document.getElementById("userAnalytics")
  const activeUsers = adminData.users.filter((user) => user.status === "active").length
  const totalUsers = adminData.users.length
  const activePercentage = ((activeUsers / totalUsers) * 100).toFixed(1)

  userAnalytics.innerHTML = `
        <div style="padding: 1rem 0;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
                <span>Usuarios Activos</span>
                <strong>${activeUsers}/${totalUsers}</strong>
            </div>
            <div style="background: #eee; height: 10px; border-radius: 5px; overflow: hidden;">
                <div style="background: linear-gradient(135deg, #667eea, #764ba2); height: 100%; width: ${activePercentage}%; transition: width 0.3s ease;"></div>
            </div>
            <p style="margin-top: 0.5rem; color: #666; font-size: 0.9rem;">${activePercentage}% de usuarios activos</p>
        </div>
        <div style="padding: 1rem 0; border-top: 1px solid #eee;">
            <h4 style="margin-bottom: 1rem;">Registros por Mes</h4>
            <p style="color: #666;">Enero: 15 nuevos usuarios</p>
            <p style="color: #666;">Febrero: 23 nuevos usuarios</p>
            <p style="color: #666;">Marzo: 18 nuevos usuarios</p>
        </div>
    `
}

function loadSettingsData() {
  // Los datos de configuración se cargan desde localStorage o valores por defecto
  const settings = JSON.parse(localStorage.getItem("storeSettings")) || {
    storeName: "BookStore",
    storeEmail: "admin@bookstore.com",
    storePhone: "+57 300 123 4567",
    shippingCost: 5000,
    freeShippingFrom: 50000,
    deliveryTime: 3,
  }

  // Llenar los campos del formulario
  document.getElementById("storeName").value = settings.storeName
  document.getElementById("storeEmail").value = settings.storeEmail
  document.getElementById("storePhone").value = settings.storePhone
  document.getElementById("shippingCost").value = settings.shippingCost
  document.getElementById("freeShippingFrom").value = settings.freeShippingFrom
  document.getElementById("deliveryTime").value = settings.deliveryTime
}

function setupEventListeners() {
  // Filtro de pedidos
  const orderFilter = document.getElementById("orderFilter")
  if (orderFilter) {
    orderFilter.addEventListener("change", loadOrdersData)
  }

  // Búsqueda de usuarios
  const userSearch = document.getElementById("userSearch")
  if (userSearch) {
    userSearch.addEventListener("input", loadUsersData)
  }

  // Formularios de configuración
  const generalSettings = document.getElementById("generalSettings")
  if (generalSettings) {
    generalSettings.addEventListener("submit", saveGeneralSettings)
  }

  const shippingSettings = document.getElementById("shippingSettings")
  if (shippingSettings) {
    shippingSettings.addEventListener("submit", saveShippingSettings)
  }

  // Formulario de agregar libro
  const addBookForm = document.getElementById("addBookForm")
  if (addBookForm) {
    addBookForm.addEventListener("submit", addFeaturedBook)
  }
}

// Funciones de utilidad
function getStatusText(status) {
  const statusTexts = {
    pending: "Pendiente",
    processing: "En Proceso",
    shipped: "Enviado",
    delivered: "Entregado",
  }
  return statusTexts[status] || status
}

function showNotification(message, type = "info") {
  // Crear elemento de notificación
  const notification = document.createElement("div")
  notification.className = `notification notification-${type}`
  notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === "success" ? "#d4edda" : type === "error" ? "#f8d7da" : "#d1ecf1"};
        color: ${type === "success" ? "#155724" : type === "error" ? "#721c24" : "#0c5460"};
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 3000;
        animation: slideInRight 0.3s ease;
    `
  notification.textContent = message

  document.body.appendChild(notification)

  // Remover después de 3 segundos
  setTimeout(() => {
    notification.style.animation = "slideOutRight 0.3s ease"
    setTimeout(() => {
      document.body.removeChild(notification)
    }, 300)
  }, 3000)
}

// Funciones de acciones
function viewOrderDetails(orderId) {
  const order = adminData.orders.find((o) => o.id === orderId)
  if (!order) return

  const modal = document.getElementById("orderDetailsModal")
  const content = document.getElementById("orderDetailsContent")

  content.innerHTML = `
        <div style="padding: 2rem;">
            <h4>Pedido ${order.id}</h4>
            <p><strong>Cliente:</strong> ${order.customer}</p>
            <p><strong>Email:</strong> ${order.email}</p>
            <p><strong>Fecha:</strong> ${order.date}</p>
            <p><strong>Estado:</strong> <span class="status-badge status-${order.status}">${getStatusText(order.status)}</span></p>
            
            <h5 style="margin-top: 2rem; margin-bottom: 1rem;">Productos:</h5>
            <div class="order-items">
                ${order.items
                  .map(
                    (item) => `
                    <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #eee;">
                        <div>
                            <strong>${item.title}</strong><br>
                            <small>por ${item.author}</small>
                        </div>
                        <div style="text-align: right;">
                            <div>Cantidad: ${item.quantity}</div>
                            <div>$${item.price.toLocaleString()}</div>
                        </div>
                    </div>
                `,
                  )
                  .join("")}
            </div>
            
            <div style="margin-top: 2rem; padding-top: 1rem; border-top: 2px solid #eee;">
                <div style="display: flex; justify-content: space-between; font-size: 1.2rem; font-weight: bold;">
                    <span>Total:</span>
                    <span>$${order.total.toLocaleString()}</span>
                </div>
            </div>
        </div>
    `

  modal.classList.add("active")
}

function closeOrderDetailsModal() {
  document.getElementById("orderDetailsModal").classList.remove("active")
}

function updateOrderStatus(orderId) {
  const order = adminData.orders.find((o) => o.id === orderId)
  if (!order) return

  const statuses = ["pending", "processing", "shipped", "delivered"]
  const currentIndex = statuses.indexOf(order.status)
  const nextIndex = (currentIndex + 1) % statuses.length

  order.status = statuses[nextIndex]

  // Guardar en localStorage
  localStorage.setItem("adminOrders", JSON.stringify(adminData.orders))

  // Recargar datos
  loadOrdersData()
  showNotification(`Estado del pedido ${orderId} actualizado a ${getStatusText(order.status)}`, "success")
}

function editUser(userId) {
  showNotification("Función de editar usuario en desarrollo", "info")
}

function toggleUserStatus(userId) {
  const user = adminData.users.find((u) => u.id === userId)
  if (!user) return

  user.status = user.status === "active" ? "inactive" : "active"

  // Guardar en localStorage
  localStorage.setItem("adminUsers", JSON.stringify(adminData.users))

  // Recargar datos
  loadUsersData()
  showNotification(`Estado del usuario ${user.name} actualizado`, "success")
}

function openAddBookModal() {
  document.getElementById("addBookModal").classList.add("active")
}

function closeAddBookModal() {
  document.getElementById("addBookModal").classList.remove("active")
  document.getElementById("addBookForm").reset()
}

function addFeaturedBook(e) {
  e.preventDefault()

  const formData = new FormData(e.target)
  const newBook = {
    id: Date.now(),
    title: formData.get("bookTitle") || document.getElementById("bookTitle").value,
    author: formData.get("bookAuthor") || document.getElementById("bookAuthor").value,
    price: Number.parseInt(formData.get("bookPrice") || document.getElementById("bookPrice").value),
    image: formData.get("bookImage") || document.getElementById("bookImage").value || "/abstract-book-cover.png",
    description: formData.get("bookDescription") || document.getElementById("bookDescription").value,
  }

  adminData.featuredBooks.push(newBook)

  // Guardar en localStorage
  localStorage.setItem("adminFeaturedBooks", JSON.stringify(adminData.featuredBooks))

  // Recargar datos y cerrar modal
  loadBooksData()
  closeAddBookModal()
  showNotification("Libro agregado exitosamente", "success")
}

function editBook(bookId) {
  showNotification("Función de editar libro en desarrollo", "info")
}

function deleteBook(bookId) {
  if (confirm("¿Estás seguro de que quieres eliminar este libro?")) {
    adminData.featuredBooks = adminData.featuredBooks.filter((book) => book.id !== bookId)

    // Guardar en localStorage
    localStorage.setItem("adminFeaturedBooks", JSON.stringify(adminData.featuredBooks))

    // Recargar datos
    loadBooksData()
    showNotification("Libro eliminado exitosamente", "success")
  }
}

function generateSalesReport() {
  const period = document.getElementById("salesPeriod").value
  const reportContent = document.getElementById("salesReport")

  // Simular generación de reporte
  const totalSales = adminData.orders.reduce((sum, order) => sum + order.total, 0)
  const avgOrderValue = totalSales / adminData.orders.length

  reportContent.innerHTML = `
        <div style="padding: 1rem; background: #f8f9fa; border-radius: 8px; margin-top: 1rem;">
            <h4>Reporte de Ventas - ${period === "week" ? "Esta Semana" : period === "month" ? "Este Mes" : "Este Año"}</h4>
            <p><strong>Ventas Totales:</strong> $${totalSales.toLocaleString()}</p>
            <p><strong>Número de Pedidos:</strong> ${adminData.orders.length}</p>
            <p><strong>Valor Promedio por Pedido:</strong> $${Math.round(avgOrderValue).toLocaleString()}</p>
            <p><strong>Fecha de Generación:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
    `

  showNotification("Reporte generado exitosamente", "success")
}

function exportUsers() {
  // Simular exportación de usuarios
  const csvContent =
    "data:text/csv;charset=utf-8," +
    "ID,Nombre,Email,Fecha Registro,Pedidos,Estado\n" +
    adminData.users
      .map((user) => `${user.id},${user.name},${user.email},${user.registerDate},${user.orders},${user.status}`)
      .join("\n")

  const encodedUri = encodeURI(csvContent)
  const link = document.createElement("a")
  link.setAttribute("href", encodedUri)
  link.setAttribute("download", "usuarios.csv")
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  showNotification("Lista de usuarios exportada exitosamente", "success")
}

function saveGeneralSettings(e) {
  e.preventDefault()

  const settings = JSON.parse(localStorage.getItem("storeSettings")) || {}
  settings.storeName = document.getElementById("storeName").value
  settings.storeEmail = document.getElementById("storeEmail").value
  settings.storePhone = document.getElementById("storePhone").value

  localStorage.setItem("storeSettings", JSON.stringify(settings))
  showNotification("Configuración general guardada exitosamente", "success")
}

function saveShippingSettings(e) {
  e.preventDefault()

  const settings = JSON.parse(localStorage.getItem("storeSettings")) || {}
  settings.shippingCost = Number.parseInt(document.getElementById("shippingCost").value)
  settings.freeShippingFrom = Number.parseInt(document.getElementById("freeShippingFrom").value)
  settings.deliveryTime = Number.parseInt(document.getElementById("deliveryTime").value)

  localStorage.setItem("storeSettings", JSON.stringify(settings))
  showNotification("Configuración de envío guardada exitosamente", "success")
}

function logout() {
  // Confirmación más visible y segura para admin
  const confirmMessage = "⚠️ ¿ESTÁS SEGURO DE QUE QUIERES CERRAR SESIÓN DE ADMINISTRADOR?\n\n" +
                        "Esta acción cerrará tu sesión de administrador de forma permanente.\n" +
                        "Todos los datos locales se eliminarán.\n\n" +
                        "Presiona 'Aceptar' para continuar o 'Cancelar' para permanecer conectado.";
  
  if (!confirm(confirmMessage)) {
    return; // El usuario canceló
  }
  
  // Deshabilitar el botón
  const logoutBtn = document.querySelector('.logout-btn');
  if (logoutBtn) {
    logoutBtn.disabled = true;
    logoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cerrando sesión...';
  }
  
  // Función para limpiar todos los datos del cliente
  function clearAllClientData() {
    try {
      // Limpiar localStorage completamente
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Limpiar sessionStorage
      try {
        sessionStorage.clear();
      } catch (e) {
        console.warn("Error al limpiar sessionStorage:", e);
      }
      
      // Limpiar cookies del cliente
      document.cookie.split(";").forEach(function(c) {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
    } catch (error) {
      console.error("Error al limpiar datos del cliente:", error);
    }
  }
  
  // Verificar sesión antes de cerrar (con headers anti-caché)
  fetch("http://localhost:3000/check-session?" + Date.now(), {
    method: "GET",
    credentials: "include",
    cache: "no-store",
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0"
    }
  })
  .then(response => response.json())
  .then(sessionData => {
    // Llamar al endpoint del backend para cerrar sesión de forma segura
    return fetch("http://localhost:3000/logout?" + Date.now(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      },
      credentials: "include",
      cache: "no-store",
      referrerPolicy: "no-referrer"
    });
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    if (data.success) {
      clearAllClientData();
      
      // Verificar que la sesión se cerró correctamente (sin caché)
      return fetch("http://localhost:3000/check-session?" + Date.now(), {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0"
        }
      })
      .then(response => response.json())
      .then(verifyData => {
        if (!verifyData.isAuthenticated) {
          showNotification("✅ Sesión de administrador cerrada de forma segura", "success");
          
          // Limpiar caché antes de redirigir
          if ('caches' in window) {
            caches.keys().then(names => {
              names.forEach(name => {
                caches.delete(name);
              });
            });
          }
          
          // Eliminar completamente la entrada del historial
          window.history.pushState(null, "", "login.html?logout=success&nocache=" + Date.now());
          window.history.replaceState(null, "", "login.html?logout=success&nocache=" + Date.now());
          
          setTimeout(() => {
            window.location.replace("login.html?logout=success&nocache=" + Date.now());
            // Forzar recarga completa sin caché
            setTimeout(() => {
              window.location.href = "login.html?logout=success&nocache=" + Date.now();
            }, 100);
          }, 1000);
        } else {
          clearAllClientData();
          showNotification("⚠️ Cerrando sesión localmente...", "warning");
          
          // Limpiar caché antes de redirigir
          if ('caches' in window) {
            caches.keys().then(names => {
              names.forEach(name => {
                caches.delete(name);
              });
            });
          }
          
          setTimeout(() => {
            window.location.replace("login.html?logout=local&nocache=" + Date.now());
          }, 1000);
        }
      });
    } else {
      throw new Error(data.message || "Error al cerrar sesión");
    }
  })
  .catch(error => {
    console.error("Error al cerrar sesión:", error);
    clearAllClientData();
    showNotification("⚠️ Sesión cerrada localmente (verifica la conexión)", "warning");
    
    // Limpiar caché antes de redirigir
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }
    
    setTimeout(() => {
      window.location.replace("login.html?logout=local&error=connection&nocache=" + Date.now());
    }, 1500);
  });
}

// Agregar estilos CSS para las animaciones de notificación
const style = document.createElement("style")
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`
document.head.appendChild(style)
