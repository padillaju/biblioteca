// Datos de libros (pueden ser obtenidos de una API o base de datos)            

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
    renderSidebarProfile(); // <-- Agrega esta línea
});




function showSection(sectionId) {
    // Ocultar todas las secciones
    document.querySelectorAll(".section").forEach(section => {
        section.classList.remove("active");
    });

    // Quitar active de todas las pestañas
    document.querySelectorAll(".sidebar-tab").forEach(tab => {
        tab.classList.remove("active");
    });

    // Mostrar la sección seleccionada
    document.getElementById(`${sectionId}-section`).classList.add("active");

    // Activar la pestaña clickeada
    event.target.classList.add("active");
}

// ===== CARRO DE COMPRAS (actualizado para sidebar) =====
function getCart() {
    const cart = localStorage.getItem("bookCart");
    return cart ? JSON.parse(cart) : [];
}

function saveCart(cart) {
    localStorage.setItem("bookCart", JSON.stringify(cart));
    updateCartCount();
    renderCart(); // Actualizar vista del carrito en sidebar
}

function updateCartCount() {
    const count = getCart().length;
    const elements = document.querySelectorAll("#cart-count, #sidebar-cart-count");
    elements.forEach(el => el.innerText = count);
}

function addToCart(bookId, title, authors, price, imageUrl) {
    const newBook = { id: bookId, title, authors, price, imageUrl };
    let cart = getCart();

    const exists = cart.some(book => book.id === bookId);
    if (exists) {
        alert("📚 Este libro ya está en tu carrito.");
        return;
    }

    cart.push(newBook);
    saveCart(cart);
    alert(`✅"${title}" añadido al carrito.`);
}

function renderCart() {
    const cart = getCart();
    const cartItemsDiv = document.getElementById("cart-items");
    const clearCartBtn = document.getElementById("clear-cart-btn");

    if (cart.length === 0) {
        cartItemsDiv.innerHTML = "<p>Tu carrito está vacío.</p>";
        clearCartBtn.style.display = "none";
    } else {
        clearCartBtn.style.display = "block";
        let html = "";
        cart.forEach((book, index) => {
            html += `
                <div class="cart-item">
                    <img src="${book.imageUrl}" alt="${book.title}">
                    <div class="cart-item-info">
                        <h4 class="cart-item-title">${book.title}</h4>
                        <p class="cart-item-author">${book.authors}</p>
                        <p class="cart-item-price">${book.price}</p>
                    </div>
                    <button class="remove-btn" onclick="removeFromCart(${index})">🗑️</button>
                </div>
            `;
        });
        cartItemsDiv.innerHTML = html;
    }
}

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

// ===== PERFIL / SALIR =====
function logout() {
    if (confirm("¿Quieres cerrar sesión?")) {
        // Aquí podrías limpiar localStorage de sesión, tokens, etc.
        localStorage.removeItem("userSession"); // placeholder
        alert("👋 Has cerrado sesión.");
        toggleSidebar(); // Cierra sidebar
        // window.location.href = "/"; // Opcional: redirigir al inicio
    }
}

// ===== INICIALIZAR =====
document.addEventListener("DOMContentLoaded", function() {
    updateCartCount();
    renderCart(); // Renderiza carrito al cargar
});




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
                books.forEach(book => {
                    const title = book.volumeInfo.title;
                    const authors = book.volumeInfo.authors ? book.volumeInfo.authors.join(", ") : "Autor desconocido";
                    const description = book.volumeInfo.description || "No disponible";
                    const imageUrl = book.volumeInfo.imageLinks ? book.volumeInfo.imageLinks.thumbnail : "https://via.placeholder.com/200x300?text=Sin+Imagen";
                    const price = book.saleInfo && book.saleInfo.listPrice ? 
                        `$${book.saleInfo.listPrice.amount.toLocaleString()}` : 
                        "Precio no disponible";

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
                                 <button class="btn btn-secondary" onclick="addToCart('${book.id}')" aria-label="Añadir ${title} al carrito">
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
    