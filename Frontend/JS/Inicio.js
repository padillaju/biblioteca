// Datos de libros (pueden ser obtenidos de una API o base de datos)            


function goMiCuenta() {
   window.location.href = "mi-cuenta.html";
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
    if (confirm("¿Estás seguro de vaciar el carrito?")) {
        localStorage.removeItem("bookCart");
        updateCartCount();
        renderCart();
    }
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

    // Mostrar modal (usar flex para centrar con CSS)
    const modal = document.getElementById("bookModal");
    modal.style.display = "flex";

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



function addToCart(libroId, titulo, autores, precio, imagen) {
    fetch("http://localhost:3000/carrito/agregar", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            libro_id_api: libroId,
            titulo: titulo,
            cantidad: 1,
            precio_unitario: parseFloat(precio.replace(/[^0-9.-]+/g,"")),
            imagen: imagen
        })
    })
    .then(response => response.json())
    .then(data => {
        if(data.success){
            alert(`"${titulo}" agregado al carrito ✅`);
        } else {
            alert("Error al agregar al carrito ❌");
        }
    })
    .catch(err => console.error("Error al agregar al carrito:", err));
}




