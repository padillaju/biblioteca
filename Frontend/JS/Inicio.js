
        // Data de libros
        const books = [
            {
                id: 1,
                title: "Cien Años de Soledad",
                author: "Gabriel García Márquez",
                price: 45000,
                description: "Una obra maestra del realismo mágico que narra la historia de la familia Buendía."
            },
            {
                id: 2,
                title: "El Alquimista",
                author: "Paulo Coelho",
                price: 38000,
                description: "Una fábula sobre seguir nuestros sueños y encontrar nuestro tesoro personal."
            },
            {
                id: 3,
                title: "1984",
                author: "George Orwell",
                price: 42000,
                description: "Una distopía que explora temas de totalitarismo y vigilancia estatal."
            },
            {
                id: 4,
                title: "Don Quijote de la Mancha",
                author: "Miguel de Cervantes",
                price: 55000,
                description: "Las aventuras del ingenioso hidalgo y su fiel escudero Sancho Panza."
            },
            {
                id: 5,
                title: "La Casa de los Espíritus",
                author: "Isabel Allende",
                price: 48000,
                description: "Saga familiar que mezcla amor, política y elementos sobrenaturales."
            },
            {
                id: 6,
                title: "Rayuela",
                author: "Julio Cortázar",
                price: 44000,
                description: "Novela experimental que puede leerse de múltiples formas."
            }
        ];

        let cart = [];
        let cartCount = 0;

        // Renderizar libros
        function renderBooks(booksToRender = books) {
            const booksGrid = document.getElementById('books-grid');
            booksGrid.innerHTML = '';

            booksToRender.forEach(book => {
                const bookCard = document.createElement('div');
                bookCard.className = 'book-card';
                bookCard.innerHTML = `
                    <div class="book-cover">${book.title}</div>
                    <div class="book-info">
                        <h3 class="book-title">${book.title}</h3>
                        <p class="book-author">por ${book.author}</p>
                        <div class="book-price">$${book.price.toLocaleString()}</div>
                        <p class="book-description">${book.description}</p>
                        <button class="buy-btn" onclick="addToCart(${book.id})">
                            Agregar al Carrito
                        </button>
                    </div>
                `;
                booksGrid.appendChild(bookCard);
            });
        }

        // Agregar al carrito
        function addToCart(bookId) {
            const book = books.find(b => b.id === bookId);
            const existingItem = cart.find(item => item.id === bookId);

            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cart.push({...book, quantity: 1});
            }

            cartCount += 1;
            updateCartUI();
            showNotification();
        }

        // Actualizar UI del carrito
        function updateCartUI() {
            document.getElementById('cart-count').textContent = cartCount;
            
            const cartItems = document.getElementById('cart-items');
            cartItems.innerHTML = '';

            if (cart.length === 0) {
                cartItems.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">Tu carrito está vacío</p>';
            } else {
                cart.forEach(item => {
                    const cartItem = document.createElement('div');
                    cartItem.className = 'cart-item';
                    cartItem.innerHTML = `
                        <div>
                            <h4>${item.title}</h4>
                            <p>Cantidad: ${item.quantity}</p>
                        </div>
                        <div>
                            <strong>$${(item.price * item.quantity).toLocaleString()}</strong>
                            <button onclick="removeFromCart(${item.id})" style="margin-left: 10px; background: #ff4757; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">×</button>
                        </div>
                    `;
                    cartItems.appendChild(cartItem);
                });
            }

            // Calcular total
            const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            document.getElementById('cart-total').textContent = `Total: $${total.toLocaleString()}`;
        }

        // Remover del carrito
        function removeFromCart(bookId) {
            const itemIndex = cart.findIndex(item => item.id === bookId);
            if (itemIndex > -1) {
                cartCount -= cart[itemIndex].quantity;
                cart.splice(itemIndex, 1);
                updateCartUI();
            }
        }

        // Toggle carrito
        function toggleCart() {
            const cartSidebar = document.getElementById('cart-sidebar');
            const overlay = document.getElementById('overlay');
            
            cartSidebar.classList.toggle('active');
            overlay.classList.toggle('active');
        }

        // Mostrar notificación
        function showNotification() {
            const notification = document.getElementById('notification');
            notification.classList.add('show');
            
            setTimeout(() => {
                notification.classList.remove('show');
            }, 3000);
        }

        // Buscar libros
        function searchBooks() {
            const query = document.getElementById('search-input').value.toLowerCase();
            const filteredBooks = books.filter(book => 
                book.title.toLowerCase().includes(query) ||
                book.author.toLowerCase().includes(query)
            );
            renderBooks(filteredBooks);
        }

        // Checkout
        function checkout() {
            if (cart.length === 0) {
                alert('Tu carrito está vacío');
                return;
            }
            
            const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            alert(`¡Gracias por tu compra!\nTotal: $${total.toLocaleString()}\n\nRedirigiendo al procesamiento de pago...`);
            
            // Limpiar carrito
            cart = [];
            cartCount = 0;
            updateCartUI();
            toggleCart();
        }

        // Inicializar página
        document.addEventListener('DOMContentLoaded', function() {
            renderBooks();
            
            // Búsqueda en tiempo real
            document.getElementById('search-input').addEventListener('input', function() {
                const query = this.value.toLowerCase();
                if (query === '') {
                    renderBooks();
                } else {
                    searchBooks();
                }
            });

            // Cerrar carrito con ESC
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                    const cartSidebar = document.getElementById('cart-sidebar');
                    if (cartSidebar.classList.contains('active')) {
                        toggleCart();
                    }
                }
            });

            // Scroll suave para navegación
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', function (e) {
                    e.preventDefault();
                    const target = document.querySelector(this.getAttribute('href'));
                    if (target) {
                        target.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                });
            });
        });

        // Animación del header al hacer scroll
        window.addEventListener('scroll', function() {
            const header = document.querySelector('header');
            if (window.scrollY > 100) {
                header.style.background = 'rgba(255, 255, 255, 0.98)';
                header.style.boxShadow = '0 8px 32px rgba(31, 38, 135, 0.5)';
            } else {
                header.style.background = 'rgba(255, 255, 255, 0.95)';
                header.style.boxShadow = '0 8px 32px rgba(31, 38, 135, 0.37)';
            }
        });
    