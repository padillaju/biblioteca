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
    // Cargar todos los libros al inicio y renderizarlos en la sección principal
    fetch('/libros')
        .then(r => r.json())
        .then(data => {
            const books = (data && data.success && Array.isArray(data.books)) ? data.books : [];
            renderBooksList(books);
        })
        .catch(err => console.warn('No se pudieron cargar libros:', err))
})

// Cargar géneros disponibles para el filtro (panel con checkboxes)
document.addEventListener('DOMContentLoaded', function() {
    const panelList = document.getElementById('genre-list');
    const toggle = document.getElementById('genre-toggle');
    if (!panelList || !toggle) return;

    const defaultGenres = ['Fantasía','Ficción','Historia','Romance','Terror','Aventura','Drama','No ficción'];

    function renderGenresList(list) {
        panelList.innerHTML = '';
        list.forEach(rawG => {
            const g = String(rawG || '').trim();
            if (!g) return;
            const opt = document.createElement('button');
            opt.type = 'button';
            opt.className = 'genre-option';
            opt.textContent = g;
            opt.addEventListener('click', function(e) {
                e.stopPropagation();
                setSelectedGenre(g);
                // cargar libros inmediatamente al seleccionar
                searchBooks();
            });
            panelList.appendChild(opt);
        });
    }

    fetch('/generos')
        .then(r => r.json())
        .then(data => {
            const genres = (data && data.success && Array.isArray(data.genres)) ? data.genres : (Array.isArray(data) ? data : []);
            if (!genres || genres.length === 0) {
                renderGenresList(defaultGenres);
            } else {
                renderGenresList(genres);
            }
        })
        .catch(err => {
            console.warn('No se pudieron cargar géneros, usando lista por defecto:', err);
            renderGenresList(defaultGenres);
        });

    // Toggle behavior
    toggle.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleGenrePanel();
    });

    // Nota: el botón "Limpiar" fue eliminado; la selección se limpia desde el chip.

    // Cerrar panel al hacer click fuera
    document.addEventListener('click', function(e) {
        const panel = document.getElementById('genre-panel');
        if (!panel) return;
        const isInside = panel.contains(e.target) || toggle.contains(e.target);
        if (!isInside) {
            panel.hidden = true;
            toggle.setAttribute('aria-expanded', 'false');
        }
    });
});

function getSelectedGenres() {
    const toggle = document.getElementById('genre-toggle');
    if (!toggle) return [];
    const sel = String(toggle.dataset.selected || '').trim();
    return sel ? [sel.toLowerCase()] : [];
}

// Normalizar cadenas para comparación (quita acentos y pasa a lower-case)
function normalizeStr(s) {
    if (!s) return '';
    try {
        return String(s).normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
    } catch (e) {
        // Fallback cuando no se soportan clases Unicode en el engine
        return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    }
}

function renderGenreChips() {
    const chips = document.getElementById('genre-chips');
    if (!chips) return;
    chips.innerHTML = '';
    const selected = (function(){
        const t = document.getElementById('genre-toggle');
        return t && t.dataset && t.dataset.selected ? [t.dataset.selected] : [];
    })();
    if (selected.length === 0) {
        document.getElementById('genre-toggle').innerHTML = 'Todos los géneros <i class="fas fa-chevron-down"></i>';
        return;
    }
    selected.forEach(g => {
        const chip = document.createElement('div');
        chip.className = 'genre-chip';
        const txt = document.createElement('span');
        txt.textContent = g;
        const btn = document.createElement('button');
        btn.className = 'remove-chip';
        btn.innerHTML = '×';
        btn.addEventListener('click', function() {
            setSelectedGenre('');
        });
        chip.appendChild(txt);
        chip.appendChild(btn);
        chips.appendChild(chip);
    });
    document.getElementById('genre-toggle').innerHTML = `${selected[0]} <i class="fas fa-chevron-down"></i>`;
}

function setSelectedGenre(genre) {
    const toggle = document.getElementById('genre-toggle');
    const panel = document.getElementById('genre-panel');
    if (!toggle) return;
    const g = String(genre || '').trim();
    if (!g) {
        delete toggle.dataset.selected;
    } else {
        toggle.dataset.selected = g;
    }
    renderGenreChips();
    if (panel) panel.hidden = true;
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
}

function toggleGenrePanel() {
    const panel = document.getElementById('genre-panel');
    const toggle = document.getElementById('genre-toggle');
    if (!panel || !toggle) return;
    const isHidden = panel.hidden;
    panel.hidden = !isHidden;
    toggle.setAttribute('aria-expanded', String(!panel.hidden));
}

// Render helper para mostrar una lista de libros en `#resultado`
function renderBooksList(books) {
    const resultsContainer = document.getElementById('resultado');
    if (!resultsContainer) return;
    if (!Array.isArray(books) || books.length === 0) {
        resultsContainer.innerHTML = '<div class="no-results">No hay libros para mostrar.</div>';
        const countEl = document.getElementById('results-count'); if (countEl) countEl.textContent = '0 resultados';
        return;
    }

    const html = books.map(book => `
        <div class="book-card">
            <img src="${book.image || '/abstract-book-cover.png'}" alt="${(book.title||'').replace(/"/g,'&quot;')}" class="book-image">
            <div class="book-content">
                <h3 class="book-title">${(book.title||'')}</h3>
                <p class="book-author">por ${book.author || book.autor || 'Desconocido'}</p>
                <p class="book-price">$${Number(book.price||0).toLocaleString()}</p>
                <div class="book-actions">
                    <button class="btn btn-primary" onclick="openModal('${book.id}', '${(book.title||'').replace(/'/g, "\\'")}', '${((book.author||book.autor)||'').replace(/'/g, "\\'")}', '${(book.description||'').replace(/'/g, "\\'").substring(0,200)}', '${book.image || ''}', '$${Number(book.price||0).toLocaleString()}')">Ver más</button>
                    <button class="btn btn-secondary" onclick="addToCart('${book.id}', '${(book.title||'').replace(/'/g, "\\'")}', '${((book.author||book.autor)||'').replace(/'/g, "\\'")}', '$${Number(book.price||0).toLocaleString()}', '${book.image || ''}')">Añadir</button>
                    <button class="btn btn-save" onclick="saveBook('${book.id}', '${(book.title||'').replace(/'/g, "\\'")}', '${((book.author||book.autor)||'').replace(/'/g, "\\'")}', '$${Number(book.price||0).toLocaleString()}', '${book.image || ''}')">Guardar</button>
                </div>
            </div>
        </div>
    `).join('');

    resultsContainer.innerHTML = html;
    const countEl = document.getElementById('results-count');
    if (countEl) countEl.textContent = `${books.length} resultado(s)`;
}




function searchBooks() {
    console.log("Buscando libros...");
    const query = document.getElementById("search-input").value;
    const q = String(query || '').trim().toLowerCase();
    // Determinar campo de búsqueda: 'all' | 'title' | 'author'
    const fieldEl = document.getElementById('search-field');
    const selectedField = fieldEl ? String(fieldEl.value || 'all') : 'all';
    // Leer filtros de precio (usar parseNumberString para soportar separadores de miles)
    const minPriceRaw = document.getElementById('min-price') ? document.getElementById('min-price').value : '';
    const maxPriceRaw = document.getElementById('max-price') ? document.getElementById('max-price').value : '';
    const minPrice = minPriceRaw ? parseNumberString(minPriceRaw) : null;
    const maxPrice = maxPriceRaw ? parseNumberString(maxPriceRaw) : null;
    const resultsContainer = document.getElementById("resultado");
    resultsContainer.innerHTML = "";

    // Si no hay texto de búsqueda ni género seleccionado y tampoco filtros de precio, mostrar mensaje.
    // Permitir continuar si el usuario especificó min/max precio aunque q y género estén vacíos.
    const selected = getSelectedGenres();
    if (!q && (!selected || selected.length === 0) && minPrice == null && maxPrice == null) {
        resultsContainer.innerHTML = '<div class="no-results">Ingresa un término para buscar, selecciona un género o especifica un rango de precio.</div>';
        const rc = document.getElementById('results-count'); if (rc) rc.textContent = '';
        return;
    }

    // Construir endpoint: si hay texto usamos ?search=, si no (solo género) pedimos todos y filtramos en cliente
    const params = [`search=${encodeURIComponent(q)}`];
    const endpoint = (q && q.length > 0) ? `/libros?${params.join('&')}` : `/libros`;
    fetch(endpoint)
        .then(r => r.json())
        .then(data => {
            let books = (data && data.success && Array.isArray(data.books)) ? data.books : [];

            // Filtrar por género seleccionado en la UI (si aplica)
            const selectedGenres = getSelectedGenres();
            if (selectedGenres && selectedGenres.length > 0) {
                const sel = normalizeStr(selectedGenres[0]);
                books = books.filter(book => {
                    const g = normalizeStr(book.genre || book.genero || '');
                    return g === sel;
                });
            }

            // Filtrar por precio (si el usuario especificó)
            if (minPrice != null || maxPrice != null) {
                books = books.filter(book => {
                    const priceVal = parseNumberString(book.price || book.precio || 0) || 0;
                    if (minPrice != null && priceVal < minPrice) return false;
                    if (maxPrice != null && priceVal > maxPrice) return false;
                    return true;
                });
            }

            // Si el usuario indicó buscar por autor o título, aplicar un filtrado adicional en cliente
            if (q && selectedField && selectedField !== 'all') {
                const nq = normalizeStr(q);
                if (selectedField === 'author') {
                    books = books.filter(book => {
                        const a = normalizeStr(book.author || book.autor || '');
                        return a.indexOf(nq) !== -1;
                    });
                } else if (selectedField === 'title') {
                    books = books.filter(book => {
                        const t = normalizeStr(book.title || '');
                        return t.indexOf(nq) !== -1;
                    });
                }
            }

            // Usar el helper para renderizar la lista final
            renderBooksList(books);
        })
        .catch(err => {
            console.error('Error cargando libros locales:', err);
            resultsContainer.innerHTML = '<div class="no-results">No se pudieron cargar los libros. Intenta de nuevo más tarde.</div>';
        });
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
        // Mostrar/ocultar botón de limpiar según contenido
        const clearBtn = document.getElementById('search-clear');
        if (clearBtn) {
            const toggleClear = () => { clearBtn.style.display = (searchInput.value && searchInput.value.trim().length>0) ? 'inline-flex' : 'none'; };
            searchInput.addEventListener('input', toggleClear);
            toggleClear();
            clearBtn.addEventListener('click', (e) => {
                e.preventDefault();
                clearSearch();
            });
        }
    }
});

// Limpiar búsqueda y mostrar todos los libros (vista por defecto)
async function clearSearch() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';
    // limpiar filtros de precio
    const minEl = document.getElementById('min-price'); if (minEl) minEl.value = '';
    const maxEl = document.getElementById('max-price'); if (maxEl) maxEl.value = '';
    // limpiar selecciones de género si existe la función
    try { if (typeof clearSelectedGenres === 'function') clearSelectedGenres(); } catch(e) { /* ignore */ }

    // Traer todos los libros y renderizarlos
    try {
        const res = await fetch('/libros');
        const data = await res.json();
        const books = (data && data.success && Array.isArray(data.books)) ? data.books : [];
        renderBooksList(books);
        // ocultar botón de limpiar
        const clearBtn = document.getElementById('search-clear'); if (clearBtn) clearBtn.style.display = 'none';
    } catch (err) {
        console.error('Error al cargar libros al limpiar búsqueda:', err);
    }
}


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








