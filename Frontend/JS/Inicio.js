// Datos de libros (pueden ser obtenidos de una API o base de datos)            


function goMiCuenta() {
   window.location.href = "mi-cuenta.html";
}

// Parsear cadenas numéricas en formatos localizados (ej: "23.000", "23,000.50", "23,000", "23.50")
function parseNumberString(input) {
    if (input == null) return 0;
    let s = String(input).trim();
    if (!s) return 0;
    s = s.replace(/[^0-9,.-]/g, '');
    const hasDot = s.indexOf('.') !== -1;
    const hasComma = s.indexOf(',') !== -1;

    if (hasDot && hasComma) {
        if (s.lastIndexOf('.') > s.lastIndexOf(',')) {
            s = s.replace(/,/g, '');
            return parseFloat(s) || 0;
        } else {
            s = s.replace(/\./g, '').replace(',', '.');
            return parseFloat(s) || 0;
        }
    }

    if (hasComma) {
        const parts = s.split(',');
        if (parts[1] && parts[1].length === 3) {
            s = s.replace(/,/g, '');
            return parseFloat(s) || 0;
        }
        s = s.replace(',', '.');
        return parseFloat(s) || 0;
    }

    if (hasDot) {
        const parts = s.split('.');
        if (parts[1] && parts[1].length === 3) {
            s = s.replace(/\./g, '');
            return parseFloat(s) || 0;
        }
        return parseFloat(s) || 0;
    }

    return parseFloat(s) || 0;
}
// Compatibilidad: algunas vistas llaman a `renderCart()` — delegar a funciones locales
function renderCart() {
    if (typeof updateCartDisplay === 'function') {
        try { updateCartDisplay(); return; } catch (e) { console.warn('renderCart -> updateCartDisplay failed', e) }
    }
    if (typeof loadCart === 'function') {
        try { loadCart(); return; } catch (e) { console.warn('renderCart -> loadCart failed', e) }
    }
}


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

// Confirmación no bloqueante usando un "toast" con botones (similar a la usada en otras vistas)
function confirmWithToast(message, onConfirm, onCancel) {
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

    const timeout = setTimeout(() => { cleanup(); if (onCancel) onCancel() }, 10000)
    [btnConfirm, btnCancel].forEach(b => b.addEventListener('click', () => clearTimeout(timeout)))
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

document.addEventListener("DOMContentLoaded", function() {
    updateCartCount();
    renderCart();
    renderSidebarProfile();
});

// Mostrar mensaje de logout si viene marcado desde otra página (sessionStorage)
// No longer using sessionStorage for cross-page logout messages.
// Each view shows its own confirmation toast after logout.



// ====== CARRITO DE COMPRAS ======

function removeFromCart(index) {
    let cart = getCart();
    cart.splice(index, 1);
    saveCart(cart);
}

function clearCart() {
    confirmWithToast('¿Estás seguro de vaciar el carrito?', () => {
        localStorage.removeItem('bookCart');
        updateCartCount();
        renderCart();
        try { showToast('Carrito vaciado', 'success') } catch (e) { /* ignore */ }
    }, () => {
        try { showToast('Acción cancelada', 'error') } catch (e) { /* ignore */ }
    })
}


// ========== Logout modal handling (same behaviour as mi-cuenta) ==========
function logout() {
    const modal = document.getElementById('logout-modal')
    if (modal) modal.style.display = 'flex'
}

function cancelLogout() {
    const modal = document.getElementById('logout-modal')
    if (modal) modal.style.display = 'none'
}

async function confirmLogout() {
    try {
        const modal = document.getElementById('logout-modal')
        const footerButtons = modal ? modal.querySelectorAll('button') : []
        footerButtons.forEach(b => b.disabled = true)

        await fetch('http://localhost:3000/logout', {
            method: 'POST',
            credentials: 'include'
        })
    } catch (err) {
        console.warn('Logout API failed:', err)
    } finally {
        const modal = document.getElementById('logout-modal')
        if (modal) modal.style.display = 'none'
        localStorage.removeItem('userSession')
        // Actualizar UI local
        try { renderSidebarProfile() } catch (e) { /* ignore */ }
        // Redirect to login page without showing any toast/banner
        try { window.location.href = 'login.html' } catch (e) { /* ignore */ }
    }
}

// conectar la X del modal para cerrarlo
document.addEventListener('DOMContentLoaded', () => {
    const closeX = document.getElementById('logout-modal-close')
    if (closeX) closeX.addEventListener('click', () => {
        const modal = document.getElementById('logout-modal')
        if (modal) modal.style.display = 'none'
    })
})



// ===== INICIALIZAR =====
document.addEventListener("DOMContentLoaded", function() {
    updateCartCount();
    renderCart(); 
});

// Cargar libros destacados desde el servidor y mostrarlos en la página
document.addEventListener('DOMContentLoaded', function() {
    fetch('/libros')
        .then(r => r.json())
        .then(data => {
            const books = (data && data.success && Array.isArray(data.books)) ? data.books : []
            const grid = document.getElementById('books-grid')
            if (!grid) return

            grid.innerHTML = books.map(book => `
                <div class="book-card">
                    <img src="${book.image || '/abstract-book-cover.png'}" alt="${(book.title||'').replace(/"/g,'&quot;')}" class="book-image">
                    <div class="book-content">
                        <h3 class="book-title">${(book.title||'')}</h3>
                        <p class="book-author">por ${book.author || 'Desconocido'}</p>
                        <p class="book-price">$${Number(book.price||0).toLocaleString()}</p>
                        <div class="book-actions">
                            <button class="btn btn-primary" onclick="openModal('${book.id}', '${(book.title||'').replace(/'/g, "\\'")}', '${(book.author||'').replace(/'/g, "\\'")}', '${(book.description||'').replace(/'/g, "\\'")}', '${book.image || ''}', '$${Number(book.price||0).toLocaleString()}')">Ver más</button>
                            <button class="btn btn-secondary" onclick="addToCart('${book.id}', '${(book.title||'').replace(/'/g, "\\'")}', '${(book.author||'').replace(/'/g, "\\'")}', '$${Number(book.price||0).toLocaleString()}', '${book.image || ''}')">Añadir</button>
                            <button class="btn btn-save" onclick="saveBook('${book.id}', '${(book.title||'').replace(/'/g, "\\'")}', '${(book.author||'').replace(/'/g, "\\'")}', '$${Number(book.price||0).toLocaleString()}', '${book.image || ''}')">Guardar</button>
                        </div>
                    </div>
                </div>
            `).join('')
        })
        .catch(err => console.warn('No se pudieron cargar libros destacados:', err))
})




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
                                    <button class="btn btn-save" 
                                        onclick="saveBook('${book.id}', '${title.replace(/'/g, "\\'")}', '${authors.replace(/'/g, "\\'")}', '${price}', '${imageUrl}')" 
                                        aria-label="Guardar ${title} en favoritos">
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


// Añadir libro al carrito: intenta servidor con credenciales, cae a localStorage
async function addToCart(id, titulo, autores, precio, imagen) {
    const parsedPrice = parseNumberString(precio)
    const payload = {
        libro_id_api: id,
        titulo: titulo,
        cantidad: 1,
        precio_unitario: parsedPrice,
        imagen: imagen
    }

    // Primero intentar comprobar si el libro ya está en el carrito (servidor)
    try {
        console.debug('[addToCart] payload:', payload)
        const checkRes = await fetch('http://localhost:3000/carrito', { credentials: 'include' })
        const checkData = await checkRes.json().catch(() => ({ success: false }))
        console.debug('[addToCart] server check response:', checkData)
        if (checkData && checkData.success && Array.isArray(checkData.items)) {
            const exists = checkData.items.some(it => String(it.libro_id_api || it.id) === String(id))
            if (exists) {
                try { showToast(`"${titulo}" ya está en el carrito`, 'error') } catch (e) { /* ignore */ }
                return
            }
        }
    } catch (e) {
        // Si falla la comprobación con servidor, caeremos a la comprobación local más abajo
    }

    // También comprobar carrito local como fallback antes de intentar agregar
    try {
        const raw = localStorage.getItem('bookCart')
        let cart = raw ? JSON.parse(raw) : []
        console.debug('[addToCart] local cart before add check:', cart)
        const idx = cart.findIndex(it => String(it.id) === String(id) || String(it.libro_id_api) === String(id))
        if (idx !== -1) {
            try { showToast(`"${titulo}" ya está en el carrito`, 'error') } catch (e) { /* ignore */ }
            return
        }
    } catch (e) {
        console.warn('[addToCart] local parse error', e)
        // ignore parse errors and continue to try server add
    }

    // Intentar añadir en el servidor
    try {
        const res = await fetch('http://localhost:3000/carrito/agregar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload)
        })
        const data = await res.json().catch(() => ({ success: false }))
        console.debug('[addToCart] server add response:', data)
        if (data && data.success) {
            try { showToast(`"${titulo}" agregado al carrito`, 'success') } catch (e) { /* ignore */ }
            try { if (typeof updateAllCounts === 'function') updateAllCounts(); else if (typeof updateCartCount === 'function') updateCartCount() } catch (e) { /* ignore */ }
            try { if (typeof loadCart === 'function') loadCart(); else if (typeof renderCart === 'function') renderCart() } catch (e) { /* ignore */ }
            return
        }
    } catch (err) {
        console.warn('addToCart network error, will fallback to local', err)
    }

    // Si llegamos aquí, usar fallback local
    try {
        const raw = localStorage.getItem('bookCart')
        let cart = raw ? JSON.parse(raw) : []
        const idx = cart.findIndex(it => String(it.id) === String(id) || String(it.libro_id_api) === String(id))
        if (idx !== -1) {
            try { showToast('Este libro ya está en el carrito', 'error') } catch (e) { /* ignore */ }
        } else {
            // Normalizar para usar `libro_id_api` en objetos locales
            const localItem = { id, libro_id_api: id, titulo, autores, precio: parsedPrice, imagen, quantity: 1 }
            cart.push(localItem)
            localStorage.setItem('bookCart', JSON.stringify(cart))
            console.debug('[addToCart] local cart after push:', cart)
            try { showToast(`"${titulo}" agregado al carrito (local)`, 'success') } catch (e) { /* ignore */ }
            try { if (typeof updateAllCounts === 'function') updateAllCounts() } catch (e) { /* ignore */ }
        }
    } catch (e) {
        console.error('Error al usar fallback local en addToCart:', e)
        try { showToast('No se pudo agregar el libro al carrito', 'error') } catch (e) { /* ignore */ }
    }
}




function openModal(id, title, authors, description, imageUrl, price) {
    // Asignar valores al modal
    document.getElementById("modalImage").src = imageUrl;
    document.getElementById("modalTitle").innerText = title;
    document.getElementById("modalAuthor").innerText = `por ${authors}`;
    document.getElementById("modalPrice").innerText = price;
    document.getElementById("modalDescription").innerText = description;

    // Mostrar modal (usar flex para centrar con CSS)
    const modal = document.getElementById("bookModal");
    modal.style.display = "flex";

    // Wire modal buttons if present
    const addBtn = document.getElementById('modal-add-btn')
    if (addBtn) {
        addBtn.onclick = function (e) {
            // prevenir doble submit visual
            try { addToCart(id, title, authors, price, imageUrl) } catch (err) { console.warn('addToCart failed from modal', err) }
            // opcional: cerrar modal al añadir
            try { modal.style.display = 'none' } catch (e) { /* ignore */ }
        }
    }

    // Nota: el botón "Ver más" fue eliminado del modal; navegación a detalle se hace desde la tarjeta.

    // Cerrar al hacer clic fuera
    modal.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    };
}


// Cerrar modal con la X
document.addEventListener('DOMContentLoaded', function() {
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
});


// ===== FUNCIONES DE FAVORITOS =====
function saveBook(id, title, author, price, imageUrl) {
    try {
        const key = "bookFavorites";
        const stored = localStorage.getItem(key);
        const favorites = stored ? JSON.parse(stored) : [];

        // Evitar duplicados por id
        if (favorites.some(b => b.id === id)) {
            showToast("Este libro ya está en tus favoritos.", "error");
            return;
        }

        const book = {
            id,
            title,
            author,
            price,
            imageUrl,
            savedAt: new Date().toISOString()
        };

        favorites.push(book);
        localStorage.setItem(key, JSON.stringify(favorites));

        // Actualizar contador si existe en la página
        const favStat = document.getElementById('favorites-stat') || document.getElementById('favorites-count');
        if (favStat) favStat.textContent = favorites.length;

        showToast("Libro guardado en favoritos.", "success");
    } catch (err) {
        console.error("Error guardando favorito:", err);
        showToast("No se pudo guardar el libro.", "error");
    }
}








