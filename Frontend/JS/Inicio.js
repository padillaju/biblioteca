// Datos de libros (pueden ser obtenidos de una API o base de datos)            

// ========funciont toast========
function showToast(message, type = "success") {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.classList.add("toast");

    if (type === "error") {
        toast.style.background = "#f44336"; // rojo
        toast.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    } else {
        toast.style.background = "#4caf50"; // verde
        toast.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    }

    container.appendChild(toast);

    setTimeout(() => toast.classList.add("show"), 100);

    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}





// ===== SIDEBAR =====
function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("overlay");

    sidebar.classList.toggle("open");
    overlay.classList.toggle("active");
}

// perfil en sidebar

function renderSidebarProfile() {
    const profileDiv = document.getElementById("sidebar-profile");
    const user = JSON.parse(localStorage.getItem("userSession"));
    if (user) {
        profileDiv.innerHTML = `
            <img src="${user.avatar}" alt="Avatar">
            <div class="profile-info">
                <span class="profile-name">${user.nombre}</span>
                <span class="profile-email">${user.email}</span>
            </div>
        `;
    } else {
        profileDiv.innerHTML = "";
    }
}

// Función para verificar si hay sesión activa
function checkSession() {
    const user = JSON.parse(localStorage.getItem("userSession") || "null");
    const logoutBtn = document.getElementById("logout-btn");
    const loginBtn = document.getElementById("login-btn");
    
    if (user) {
        // Usuario está logueado
        if (logoutBtn) logoutBtn.style.display = "inline-block";
        if (loginBtn) loginBtn.style.display = "none";
    } else {
        // Usuario no está logueado
        if (logoutBtn) logoutBtn.style.display = "none";
        if (loginBtn) loginBtn.style.display = "inline-block";
    }
}

// Variable para prevenir múltiples intentos de logout
let isLoggingOut = false;

// Función para abrir el modal de logout seguro
function logout() {
    if (isLoggingOut) {
        showToast("El cierre de sesión ya está en proceso...", "warning");
        return;
    }
    
    const modal = document.getElementById("logoutModal");
    if (modal) {
        modal.classList.add("active");
        modal.style.display = "flex";
        document.body.style.overflow = "hidden"; // Prevenir scroll mientras el modal está abierto
    }
}

// Función para cerrar el modal de logout
function closeLogoutModal() {
    const modal = document.getElementById("logoutModal");
    if (modal) {
        modal.classList.remove("active");
        modal.style.display = "none";
        document.body.style.overflow = ""; // Restaurar scroll
    }
}

// Función para confirmar el cierre de sesión seguro
function confirmSecureLogout() {
    if (isLoggingOut) {
        return; // Ya está procesando
    }
    
    isLoggingOut = true;
    
    // Deshabilitar botón de confirmación
    const confirmBtn = document.getElementById("confirm-logout-btn");
    if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cerrando sesión de forma segura...';
    }
    
    // Mostrar timer de seguridad
    const securityTimer = document.getElementById("security-timer");
    if (securityTimer) {
        securityTimer.style.display = "block";
    }
    
    // Deshabilitar el botón principal para evitar múltiples clics
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
        logoutBtn.disabled = true;
        logoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cerrando sesión...';
    }
    
    
    // Función para limpiar todos los datos del cliente de forma segura
    function clearAllClientData() {
        try {
            // Limpiar localStorage completamente (buscar todas las claves relacionadas)
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (
                    key.toLowerCase().includes('user') || 
                    key.toLowerCase().includes('session') || 
                    key.toLowerCase().includes('cart') || 
                    key.toLowerCase().includes('admin') ||
                    key.toLowerCase().includes('token') ||
                    key.toLowerCase().includes('auth') ||
                    key.toLowerCase().includes('login')
                )) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => {
                try {
                    localStorage.removeItem(key);
                } catch (e) {
                    console.warn(`Error al eliminar ${key}:`, e);
                }
            });
            
            // Limpiar todos los datos relacionados con la sesión específicamente
            const sessionKeys = ["userSession", "isAdmin", "bookCart", "userData", "sessionToken", "authToken", "loginData"];
            sessionKeys.forEach(key => {
                try {
                    localStorage.removeItem(key);
                } catch (e) {
                    console.warn(`Error al eliminar ${key}:`, e);
                }
            });
            
            // Limpiar sessionStorage completamente
            try {
                sessionStorage.clear();
            } catch (e) {
                console.warn("Error al limpiar sessionStorage:", e);
                // Intentar eliminar individualmente
                try {
                    for (let i = sessionStorage.length - 1; i >= 0; i--) {
                        const key = sessionStorage.key(i);
                        if (key) sessionStorage.removeItem(key);
                    }
                } catch (e2) {
                    console.error("Error crítico al limpiar sessionStorage:", e2);
                }
            }
            
            // Limpiar todas las cookies del cliente de forma segura
            try {
                const cookies = document.cookie.split(";");
                cookies.forEach(function(cookie) {
                    const eqPos = cookie.indexOf("=");
                    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
                    // Limpiar con diferentes paths y dominios
                    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;";
                    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;domain=" + window.location.hostname + ";";
                    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;domain=." + window.location.hostname + ";";
                });
            } catch (e) {
                console.warn("Error al limpiar cookies:", e);
            }
            
            // Limpiar variables en memoria (si existen)
            const memoryVars = ['userData', 'sessionToken', 'authToken', 'loginData', 'userSession'];
            memoryVars.forEach(varName => {
                try {
                    if (typeof window[varName] !== 'undefined') {
                        delete window[varName];
                    }
                } catch (e) {
                    console.warn(`Error al eliminar ${varName} de memoria:`, e);
                }
            });
            
            // Limpiar cualquier intervalo o timeout activo
            try {
                // Limpiar todos los intervalos (solo los que empezaron después de esta página)
                for (let i = 1; i < 99999; i++) {
                    window.clearInterval(i);
                    window.clearTimeout(i);
                }
            } catch (e) {
                // No crítico
            }
            
        } catch (error) {
            console.error("Error crítico al limpiar datos del cliente:", error);
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
                "X-Requested-With": "XMLHttpRequest", // Protección adicional
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0"
            },
            credentials: "include", // Importante para enviar la cookie de sesión
            cache: "no-store", // No cachear la petición
            referrerPolicy: "no-referrer" // No enviar referrer por seguridad
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
            // Limpiar todos los datos del cliente
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
                    // Sesión cerrada correctamente
                    
                    // Cerrar modal
                    closeLogoutModal();
                    
                    showToast("✅ Sesión cerrada de forma segura", "success");
                    
                    // Actualizar UI
                    checkSession();
                    renderSidebarProfile();
                    
                    // Limpiar cualquier intervalo o timeout activo
                    // Forzar recarga completa de la página para asegurar limpieza
                    setTimeout(() => {
                    // Eliminar completamente la entrada del historial
                    // Crear una nueva entrada en el historial para la página de login
                    window.history.pushState(null, "", "login.html?logout=success&nocache=" + Date.now());
                    
                    // Forzar limpieza de caché antes de redirigir
                    if ('caches' in window) {
                        caches.keys().then(names => {
                            names.forEach(name => {
                                caches.delete(name);
                            });
                        });
                    }
                    
                    // Redirigir y reemplazar el historial completamente
                    const loginUrl = "login.html?logout=success&nocache=" + Date.now() + "&_=" + Math.random();
                    
                    // Limpiar el historial y forzar redirección
                    window.history.replaceState(null, "", loginUrl);
                    window.location.replace(loginUrl);
                    
                    // Forzar recarga completa sin caché
                    setTimeout(() => {
                        window.location.href = loginUrl;
                    }, 100);
                    }, 1500);
                } else {
                    // La sesión aún está activa, intentar cerrar de nuevo
                    console.warn("La sesión no se cerró correctamente, reintentando...");
                    clearAllClientData();
                    closeLogoutModal();
                    showToast("⚠️ Cerrando sesión localmente...", "warning");
                    
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
                isLoggingOut = false;
            });
        } else {
            throw new Error(data.message || "Error al cerrar sesión");
        }
    })
    .catch(error => {
        console.error("Error al cerrar sesión:", error);
        
        // Aun así, limpiar todos los datos del cliente por seguridad
        clearAllClientData();
        
        // Cerrar modal
        closeLogoutModal();
        
        // Actualizar UI
        checkSession();
        renderSidebarProfile();
        
        // Mostrar advertencia
        showToast("⚠️ Sesión cerrada localmente (verifica la conexión)", "warning");
        
        // Limpiar caché antes de redirigir
        if ('caches' in window) {
            caches.keys().then(names => {
                names.forEach(name => {
                    caches.delete(name);
                });
            });
        }
        
        // Redirigir de forma segura sin caché
        setTimeout(() => {
            window.location.replace("login.html?logout=local&error=connection&nocache=" + Date.now());
        }, 1500);
        
        isLoggingOut = false;
    });
}

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
        
        // Si no hay sesión activa, redirigir inmediatamente
        if (!data.success || !data.isAuthenticated) {
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
            if (!data.success || !data.isAuthenticated) {
                // Si no hay sesión, redirigir inmediatamente
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

// Evento principal cuando se carga el DOM (consolidado)
document.addEventListener("DOMContentLoaded", async function() {
    // Verificar sesión ANTES de inicializar cualquier cosa
    const isAuthenticated = await verifySessionOnLoad();
    
    if (!isAuthenticated) {
        // Si no hay sesión, no continuar con la inicialización
        return;
    }
    
    // Prevenir navegación hacia atrás
    preventBackNavigation();
    
    // Inicializar funciones básicas
    updateCartCount();
    renderCart();
    renderSidebarProfile();
    checkSession(); // Verificar sesión al cargar la página
    
    // Configurar modal de logout
    const logoutModal = document.getElementById("logoutModal");
    if (logoutModal) {
        // Cerrar modal al hacer clic fuera
        logoutModal.addEventListener('click', function(event) {
            if (event.target === logoutModal && !isLoggingOut) {
                closeLogoutModal();
            }
        });
        
        // Cerrar con ESC (solo si no está procesando)
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape' && logoutModal.classList.contains('active') && !isLoggingOut) {
                closeLogoutModal();
            }
        });
    }
    
    // Cerrar modal de libro con la X
    const closeBtn = document.querySelector(".close");
    if (closeBtn) {
        closeBtn.onclick = function() {
            document.getElementById("bookModal").style.display = "none";
        };
    }

    // Permitir búsqueda con Enter
    const searchInput = document.getElementById("search-input");
    if (searchInput) {
        searchInput.addEventListener("keypress", function(event) {
            if (event.key === "Enter") {
                searchBooks();
            }
        });
    }

    // Cargar libros destacados al cargar la página
    loadFeaturedBooks();
    
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
            
            // Si la sesión expiró, redirigir inmediatamente
            if (!data.success || !data.isAuthenticated) {
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
});




// function showSection(sectionId) {
//     // Ocultar todas las secciones
//     document.querySelectorAll(".section").forEach(section => {
//         section.classList.remove("active");
//     });

//     // Quitar active de todas las pestañas
//     document.querySelectorAll(".sidebar-tab").forEach(tab => {
//         tab.classList.remove("active");
//     });

//     // Mostrar la sección seleccionada
//     document.getElementById(`${sectionId}-section`).classList.add("active");

//     // Activar la pestaña clickeada
//     event.target.classList.add("active");
// }

// // ===== CARRO DE COMPRAS (actualizado para sidebar) =====
// function getCart() {
//     const cart = localStorage.getItem("bookCart");
//     return cart ? JSON.parse(cart) : [];
// }

// function saveCart(cart) {
//     localStorage.setItem("bookCart", JSON.stringify(cart));
//     updateCartCount();
//     renderCart(); // Actualizar vista del carrito en sidebar
// }

// function updateCartCount() {
//     const count = getCart().length;
//     const elements = document.querySelectorAll("#cart-count, #sidebar-cart-count");
//     elements.forEach(el => el.innerText = count);
// }

// function addToCart(bookId, title, authors, price, imageUrl) {
//     // Convertir el precio a número (si es posible)
//     let numericPrice = 0;
//     if (typeof price === "string") {
//         const match = price.match(/[\d,.]+/);
//         if (match) {
//             numericPrice = Number(match[0].replace(/,/g, ""));
//         }
//     } else if (typeof price === "number") {
//         numericPrice = price;
//     }

//     const newBook = { 
//         id: bookId, 
//         title, 
//         authors, 
//         price: numericPrice, 
//         imageUrl,
//         quantity: 1 // <-- importante para el carrito
//     };
//     let cart = getCart();

//     const exists = cart.some(book => book.id === bookId);
//     if (exists) {
//         showToast(" Este libro ya está en tu carrito.", "error");
//         return;
//     }

//     cart.push(newBook);
//     saveCart(cart);
//     showToast(` "${title}" añadido al carrito.`, "success");
// }


// function renderCart() {
//     const cart = getCart();
//     const cartItemsDiv = document.getElementById("cart-items");
//     const clearCartBtn = document.getElementById("clear-cart-btn");

//     if (cart.length === 0) {
//         cartItemsDiv.innerHTML = "<p>Tu carrito está vacío.</p>";
//         clearCartBtn.style.display = "none";
//     } else {
//         clearCartBtn.style.display = "block";
//         let html = "";
//         cart.forEach((book, index) => {
//             html += `
//                 <div class="cart-item">
//                     <img src="${book.imageUrl}" alt="${book.title}">
//                     <div class="cart-item-info">
//                         <h4 class="cart-item-title">${book.title}</h4>
//                         <p class="cart-item-author">${book.authors}</p>
//                         <p class="cart-item-price">${book.price}</p>
//                     </div>
//                     <button class="remove-btn" onclick="removeFromCart(${index})">🗑️</button>
//                 </div>
//             `;
//         });
//         cartItemsDiv.innerHTML = html;
//     }
// }

function removeFromCart(index) {
    let cart = getCart();
    cart.splice(index, 1);
    saveCart(cart);
}

function clearCart() {
    if (confirm("¿Estás seguro de vaciar el carrito?")) {
        localStorage.removeItem("bookCart");
        updateCartCount();
        renderCart();
    }
}



// Eliminado - ya está en el evento principal




function searchBooks() {
    console.log("Buscando libros...");
    const query = document.getElementById("search-input").value;
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=1`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            const books = data.items;
            const resultsContainer = document.getElementById("resultado");
            resultsContainer.innerHTML = ""; // Limpiar resultados anteriores

            if (books && books.length > 0) {
                // 🔹 Filtrar solo los libros que tengan precio disponible
                const booksWithPrice = books.filter(book => 
                    book.saleInfo && book.saleInfo.listPrice && book.saleInfo.listPrice.amount > 0
                );

                // 🔹 Si no hay ninguno con precio, mostrar mensaje
                if (booksWithPrice.length === 0) {
                    resultsContainer.innerHTML = '<div class="no-results">No se encontraron libros con precio disponible.</div>';
                    return;
                }

                // 🔹 Mostrar solo los libros con precio
                booksWithPrice.forEach(book => {
                    const title = book.volumeInfo.title;
                    const authors = book.volumeInfo.authors ? book.volumeInfo.authors.join(", ") : "Autor desconocido";
                    const description = book.volumeInfo.description || "No disponible";
                    const imageUrl = book.volumeInfo.imageLinks
                        ? book.volumeInfo.imageLinks.thumbnail
                        : "https://via.placeholder.com/200x300?text=Sin+Imagen";
                    const price = `$${book.saleInfo.listPrice.amount.toLocaleString()}`;

                    const bookElement = document.createElement("div");
                    bookElement.classList.add("book-card");

                    bookElement.innerHTML = `
                        <div class="book-card">
                            <img src="${imageUrl}" alt="Portada del libro: ${title}" class="book-image" loading="lazy">
                            <div class="book-content">
                                <h3 class="book-title">${title}</h3>
                                <p class="book-author">por ${authors}</p>
                                <p class="book-price">${price}</p>
                                <div class="book-actions">
                                    <button class="btn btn-primary" 
                                        onclick="openModal('${book.id}', '${title.replace(/'/g, "\\'")}', '${authors.replace(/'/g, "\\'")}', '${description.replace(/'/g, "\\'").substring(0, 200)}...', '${imageUrl}', '${price}')"
                                        aria-label="Ver más detalles del libro ${title}">
                                        Ver más
                                    </button>
                                    <button class="btn btn-secondary" 
                                        onclick="addToCart(
                                            '${book.id}', 
                                            '${title.replace(/'/g, "\\'")}', 
                                            '${authors.replace(/'/g, "\\'")}', 
                                            '${price}', 
                                            '${imageUrl}'
                                        )" 
                                        aria-label="Añadir ${title} al carrito">
                                        Añadir
                                    </button>
                                    <button class="btn btn-save" onclick="saveBook('${book.id}')" aria-label="Guardar ${title} en favoritos">
                                        Guardar
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                    resultsContainer.appendChild(bookElement);
                });
            } else {
                resultsContainer.innerHTML = '<div class="no-results">No se encontraron libros para tu búsqueda.</div>';
            }
        })
        .catch(error => console.error("Error al buscar libros:", error));
}


// 👉 Función para agregar un libro al carrito
function addToCart(id, titulo, autor, precio, imagen) {
  console.log("Agregando libro al carrito...");

  fetch("http://localhost:3000/carrito/agregar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // 👈 ESTA LÍNEA ES LA CLAVE (envía la cookie de sesión)
    body: JSON.stringify({
      libro_id_api: id,
      titulo: titulo,
      cantidad: 1,
      precio_unitario: precio,
      imagen: imagen
    })
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        alert("Libro agregado al carrito ✅");
      } else {
        alert("Error al agregar al carrito: " + data.message);
      }
    })
    .catch(error => {
      console.error("Error al agregar al carrito:", error);
      alert("Error al agregar el libro al carrito ❌");
    });
}




function openModal(id, title, authors, description, imageUrl, price) {
    // Asignar valores al modal
    document.getElementById("modalImage").src = imageUrl;
    document.getElementById("modalTitle").innerText = title;
    document.getElementById("modalAuthor").innerText = `por ${authors}`;
    document.getElementById("modalPrice").innerText = price;
    document.getElementById("modalDescription").innerText = description;

    // Mostrar modal
    const modal = document.getElementById("bookModal");
    modal.style.display = "block";

    // Cerrar al hacer clic fuera
    modal.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    };
}


// Funciones auxiliares para escapar caracteres
function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function escapeJs(text) {
    if (!text) return '';
    return String(text)
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r');
}

// Función para cargar libros destacados desde la API
function loadFeaturedBooks() {
    console.log("Cargando libros destacados...");
    const booksGrid = document.getElementById("books-grid");
    
    if (!booksGrid) {
        console.error("No se encontró el contenedor de libros destacados");
        return;
    }

    // Mostrar estado de carga
    booksGrid.innerHTML = '<div style="text-align: center; padding: 2rem; color: #666;">Cargando libros destacados...</div>';

    // Búsquedas populares para obtener libros destacados en español
    const queries = [
        "subject:fiction",
        "subject:romance",
        "subject:mystery",
        "subject:science fiction",
        "subject:fantasy",
        "subject:biography",
        "libros bestseller",
        "novelas en español"
    ];

    // Obtener libros de diferentes categorías
    const maxResults = 12; // Total de libros a mostrar
    const booksPerQuery = 3; // Libros por cada búsqueda (aumentado para tener más opciones)

    // Función para detectar si un texto está en español
    function isSpanish(text) {
        if (!text) return false;
        // Palabras comunes en español
        const spanishWords = ['el', 'la', 'los', 'las', 'de', 'que', 'y', 'en', 'un', 'una', 'es', 'son', 'con', 'por', 'para', 'del', 'al', 'más', 'como', 'pero', 'sus', 'le', 'ha', 'me', 'se', 'lo', 'todo', 'esta', 'ser', 'son', 'dos', 'también', 'fue', 'había', 'era', 'muy', 'años', 'hasta', 'desde', 'estado', 'estaba', 'ante', 'ellos', 'ella', 'esto', 'sobre', 'entre', 'sin', 'sobre', 'durante', 'mientras', 'dentro', 'través', 'bajo', 'cerca', 'lejos', 'aquí', 'allí', 'donde', 'cuando', 'porque', 'si', 'aunque', 'pero', 'sin embargo', 'además', 'entonces', 'después', 'antes', 'luego', 'ahora', 'siempre', 'nunca', 'también', 'tampoco'];
        const lowerText = text.toLowerCase();
        const wordCount = spanishWords.filter(word => lowerText.includes(word)).length;
        // Si contiene al menos 3 palabras en español, probablemente está en español
        return wordCount >= 3 || lowerText.includes('español') || lowerText.includes('española');
    }

    // Función para obtener libros de una categoría
    function fetchBooksFromCategory(query) {
        // Priorizar libros en español usando langRestrict
        const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=${booksPerQuery}&orderBy=relevance&langRestrict=es`;
        
        return fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.items && data.items.length > 0) {
                    // Filtrar libros con imagen y descripción en español
                    const books = data.items
                        .filter(book => 
                            book.volumeInfo &&
                            book.volumeInfo.imageLinks &&
                            book.volumeInfo.imageLinks.thumbnail &&
                            (book.volumeInfo.language === 'es' || 
                             book.volumeInfo.language === 'sp' ||
                             isSpanish(book.volumeInfo.description) ||
                             isSpanish(book.volumeInfo.title))
                        )
                        .map(book => {
                            const title = book.volumeInfo.title || "Sin título";
                            const authors = book.volumeInfo.authors ? book.volumeInfo.authors.join(", ") : "Autor desconocido";
                            
                            // Intentar obtener descripción en español
                            let description = book.volumeInfo.description || "No hay descripción disponible.";
                            
                            // Si la descripción no está en español, intentar buscar una alternativa
                            if (description && !isSpanish(description) && description.length > 50) {
                                // Si la descripción es muy corta o no está en español, usar un texto genérico
                                description = "Este libro forma parte de nuestra colección destacada. Descubre más detalles en la página del libro.";
                            }
                            
                            // Si no hay descripción, crear una genérica
                            if (!description || description === "No hay descripción disponible.") {
                                description = `"${title}" es un libro destacado en nuestra biblioteca. ${authors ? `Escrito por ${authors}, ` : ''}este ejemplar forma parte de nuestra selección especial.`;
                            }
                            
                            const imageUrl = book.volumeInfo.imageLinks.thumbnail.replace("http://", "https://") || "https://via.placeholder.com/200x300?text=Sin+Imagen";
                            
                            // Precio: usar precio de venta si está disponible, sino un precio predeterminado
                            let price = "N/A";
                            let priceAmount = 0;
                            if (book.saleInfo && book.saleInfo.listPrice && book.saleInfo.listPrice.amount) {
                                priceAmount = book.saleInfo.listPrice.amount;
                                price = `$${priceAmount.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
                            } else if (book.saleInfo && book.saleInfo.retailPrice && book.saleInfo.retailPrice.amount) {
                                priceAmount = book.saleInfo.retailPrice.amount;
                                price = `$${priceAmount.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
                            } else {
                                // Precio predeterminado si no hay precio disponible
                                priceAmount = Math.floor(Math.random() * 50000) + 20000; // Precio aleatorio entre 20,000 y 70,000
                                price = `$${priceAmount.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
                            }

                            return {
                                id: book.id,
                                title: title,
                                authors: authors,
                                description: description,
                                imageUrl: imageUrl,
                                price: price,
                                priceAmount: priceAmount,
                                language: book.volumeInfo.language || 'es'
                            };
                        });
                    
                    return books;
                }
                return [];
            })
            .catch(error => {
                console.error(`Error al obtener libros de ${query}:`, error);
                return [];
            });
    }

    // Obtener libros de todas las categorías
    Promise.all(queries.map(query => fetchBooksFromCategory(query)))
        .then(results => {
            // Combinar todos los libros, filtrar duplicados y priorizar los que tienen descripción en español
            let combinedBooks = results.flat();
            
            // Eliminar duplicados por ID
            const uniqueBooks = [];
            const seenIds = new Set();
            combinedBooks.forEach(book => {
                if (!seenIds.has(book.id)) {
                    seenIds.add(book.id);
                    uniqueBooks.push(book);
                }
            });
            
            // Priorizar libros con descripción en español completa
            uniqueBooks.sort((a, b) => {
                const aHasSpanishDesc = isSpanish(a.description) ? 1 : 0;
                const bHasSpanishDesc = isSpanish(b.description) ? 1 : 0;
                return bHasSpanishDesc - aHasSpanishDesc;
            });
            
            // Limitar el total
            combinedBooks = uniqueBooks.slice(0, maxResults);
            
            if (combinedBooks.length === 0) {
                booksGrid.innerHTML = '<div style="text-align: center; padding: 2rem; color: #666;">No se pudieron cargar los libros destacados. Por favor, intenta más tarde.</div>';
                return;
            }

            // Limpiar el contenedor
            booksGrid.innerHTML = "";

            // Crear y mostrar las tarjetas de libros
            combinedBooks.forEach(book => {
                const bookCard = document.createElement("div");
                bookCard.classList.add("book-card");

                // Escapar caracteres especiales para evitar problemas con comillas y apostrofes
                const safeTitle = escapeHtml(book.title);
                const safeAuthors = escapeHtml(book.authors);
                const safeDescription = escapeHtml(book.description.substring(0, 200));
                const safePrice = escapeHtml(book.price);
                
                const jsSafeTitle = escapeJs(book.title);
                const jsSafeAuthors = escapeJs(book.authors);
                const jsSafeDescription = escapeJs(book.description.substring(0, 200));
                const jsSafeImageUrl = escapeJs(book.imageUrl);
                const jsSafeId = escapeJs(book.id);

                bookCard.innerHTML = `
                    <div class="book-cover">
                        <img src="${book.imageUrl}" alt="${safeTitle}" loading="lazy" onerror="this.src='https://via.placeholder.com/200x300?text=Sin+Imagen'">
                    </div>
                    <div class="book-info">
                        <h3 class="book-title">${safeTitle}</h3>
                        <p class="book-author">${safeAuthors}</p>
                        <p class="book-price">${safePrice}</p>
                        <p class="book-description">${safeDescription}...</p>
                        <button class="buy-btn" onclick="openModal('${jsSafeId}', '${jsSafeTitle}', '${jsSafeAuthors}', '${jsSafeDescription}...', '${jsSafeImageUrl}', '${safePrice}')">
                            Ver Detalles
                        </button>
                        <button class="buy-btn" style="margin-top: 0.5rem; background: linear-gradient(45deg, #764ba2, #667eea);" onclick="addToCart('${jsSafeId}', '${jsSafeTitle}', '${jsSafeAuthors}', ${book.priceAmount}, '${jsSafeImageUrl}')">
                            🛒 Añadir al Carrito
                        </button>
                    </div>
                `;

                booksGrid.appendChild(bookCard);
            });

            console.log(`${combinedBooks.length} libros destacados cargados exitosamente`);
        })
        .catch(error => {
            console.error("Error al cargar libros destacados:", error);
            booksGrid.innerHTML = '<div style="text-align: center; padding: 2rem; color: #f44336;">Error al cargar los libros destacados. Por favor, intenta más tarde.</div>';
        });
}




function addToCart(libroId, titulo, autores, precio, imagen) {
    // Asegurar que el precio sea un número
    let precioNumerico = precio;
    if (typeof precio === 'string') {
        precioNumerico = parseFloat(precio.replace(/[^0-9.-]+/g, ""));
    }
    
    // Si el precio no es válido, usar un precio predeterminado
    if (isNaN(precioNumerico) || precioNumerico <= 0) {
        precioNumerico = 35000; // Precio predeterminado
    }

    fetch("http://localhost:3000/carrito/agregar", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        credentials: "include", // Importante para mantener la sesión
        body: JSON.stringify({
            libro_id_api: libroId,
            titulo: titulo,
            cantidad: 1,
            precio_unitario: precioNumerico,
            imagen: imagen
        })
    })
    .then(response => response.json())
    .then(data => {
        if(data.success){
            showToast(`"${titulo}" agregado al carrito ✅`, "success");
        } else {
            showToast("Error al agregar al carrito: " + (data.message || "Error desconocido"), "error");
        }
    })
    .catch(err => {
        console.error("Error al agregar al carrito:", err);
        showToast("Error al agregar al carrito ❌", "error");
    });
}







        // // Agregar al carrito
        // function addToCart(bookId) {
        //     const book = books.find(b => b.id === bookId);
        //     const existingItem = cart.find(item => item.id === bookId);

        //     if (existingItem) {
        //         existingItem.quantity += 1;
        //     } else {
        //         cart.push({...book, quantity: 1});
        //     }

        //     cartCount += 1;
        //     updateCartUI();
        //     showNotification();
        // }

        // // Actualizar UI del carrito
        // function updateCartUI() {
        //     document.getElementById('cart-count').textContent = cartCount;
            
        //     const cartItems = document.getElementById('cart-items');
        //     cartItems.innerHTML = '';

        //     if (cart.length === 0) {
        //         cartItems.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">Tu carrito está vacío</p>';
        //     } else {
        //         cart.forEach(item => {
        //             const cartItem = document.createElement('div');
        //             cartItem.className = 'cart-item';
        //             cartItem.innerHTML = `
        //                 <div>
        //                     <h4>${item.title}</h4>
        //                     <p>Cantidad: ${item.quantity}</p>
        //                 </div>
        //                 <div>
        //                     <strong>$${(item.price * item.quantity).toLocaleString()}</strong>
        //                     <button onclick="removeFromCart(${item.id})" style="margin-left: 10px; background: #ff4757; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">×</button>
        //                 </div>
        //             `;
        //             cartItems.appendChild(cartItem);
        //         });
        //     }

        //     // Calcular total
        //     const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        //     document.getElementById('cart-total').textContent = `Total: $${total.toLocaleString()}`;
        // }

        // // Remover del carrito
        // function removeFromCart(bookId) {
        //     const itemIndex = cart.findIndex(item => item.id === bookId);
        //     if (itemIndex > -1) {
        //         cartCount -= cart[itemIndex].quantity;
        //         cart.splice(itemIndex, 1);
        //         updateCartUI();
        //     }
        // }

        // // Toggle carrito
        // function toggleCart() {
        //     const cartSidebar = document.getElementById('cart-sidebar');
        //     const overlay = document.getElementById('overlay');
            
        //     cartSidebar.classList.toggle('active');
        //     overlay.classList.toggle('active');
        // }

        // // Mostrar notificación
        // function showNotification() {
        //     const notification = document.getElementById('notification');
        //     notification.classList.add('show');
            
        //     setTimeout(() => {
        //         notification.classList.remove('show');
        //     }, 3000);
        // }

        // // Buscar libros
        // function searchBooks() {
        //     const query = document.getElementById('search-input').value.toLowerCase();
        //     const filteredBooks = books.filter(book => 
        //         book.title.toLowerCase().includes(query) ||
        //         book.author.toLowerCase().includes(query)
        //     );
        //     renderBooks(filteredBooks);
        // }

        // // Checkout
        // function checkout() {
        //     if (cart.length === 0) {
        //         alert('Tu carrito está vacío');
        //         return;
        //     }
            
        //     const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        //     alert(`¡Gracias por tu compra!\nTotal: $${total.toLocaleString()}\n\nRedirigiendo al procesamiento de pago...`);
            
        //     // Limpiar carrito
        //     cart = [];
        //     cartCount = 0;
        //     updateCartUI();
        //     toggleCart();
        // }

        // // Inicializar página
        // document.addEventListener('DOMContentLoaded', function() {
        //     renderBooks();
            
        //     // Búsqueda en tiempo real
        //     document.getElementById('search-input').addEventListener('input', function() {
        //         const query = this.value.toLowerCase();
        //         if (query === '') {
        //             renderBooks();
        //         } else {
        //             searchBooks();
        //         }
        //     });

        //     // Cerrar carrito con ESC
        //     document.addEventListener('keydown', function(e) {
        //         if (e.key === 'Escape') {
        //             const cartSidebar = document.getElementById('cart-sidebar');
        //             if (cartSidebar.classList.contains('active')) {
        //                 toggleCart();
        //             }
        //         }
        //     });

        //     // Scroll suave para navegación
        //     document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        //         anchor.addEventListener('click', function (e) {
        //             e.preventDefault();
        //             const target = document.querySelector(this.getAttribute('href'));
        //             if (target) {
        //                 target.scrollIntoView({
        //                     behavior: 'smooth',
        //                     block: 'start'
        //                 });
        //             }
        //         });
        //     });
        // });

        // // Animación del header al hacer scroll
        // window.addEventListener('scroll', function() {
        //     const header = document.querySelector('header');
        //     if (window.scrollY > 100) {
        //         header.style.background = 'rgba(255, 255, 255, 0.98)';
        //         header.style.boxShadow = '0 8px 32px rgba(31, 38, 135, 0.5)';
        //     } else {
        //         header.style.background = 'rgba(255, 255, 255, 0.95)';
        //         header.style.boxShadow = '0 8px 32px rgba(31, 38, 135, 0.37)';
        //     }
        // });
    