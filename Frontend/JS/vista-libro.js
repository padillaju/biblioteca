    // Simulación de libros (en tu caso aquí llamas a la API real)
    const librosSimulados = {
      fantasia: [
        {titulo: "El Hobbit", autor: "J.R.R. Tolkien", portada:"https://covers.openlibrary.org/b/id/6979861-L.jpg"},
        {titulo: "Harry Potter", autor: "J.K. Rowling", portada:"https://covers.openlibrary.org/b/id/7984916-L.jpg"}
      ],
      ciencia: [
        {titulo: "Dune", autor: "Frank Herbert", portada:"https://covers.openlibrary.org/b/id/8107894-L.jpg"},
        {titulo: "Fundación", autor: "Isaac Asimov", portada:"https://covers.openlibrary.org/b/id/7222246-L.jpg"}
      ],
      historia: [
        {titulo: "Sapiens", autor: "Yuval Noah Harari", portada:"https://covers.openlibrary.org/b/id/8372226-L.jpg"}
      ],
      romance: [
        {titulo: "Orgullo y prejuicio", autor: "Jane Austen", portada:"https://covers.openlibrary.org/b/id/8231856-L.jpg"}
      ]
    };

    function cargarLibros(categoria) {
      const contenedor = document.getElementById("contenedorLibros");
      contenedor.innerHTML = "";

      const libros = librosSimulados[categoria] || [];

      libros.forEach((libro, index) => {
        const card = document.createElement("div");
        card.className = "card";

        card.innerHTML = `
          <img src="${libro.portada}" alt="${libro.titulo}">
          <h3>${libro.titulo}</h3>
          <p>${libro.autor}</p>
          <div class="acciones">
            <button class="btn-carrito" onclick="agregarCarrito('${libro.titulo}')">🛒</button>
            <button class="btn-like" onclick="toggleLike(this)">❤</button>
          </div>
        `;

        contenedor.appendChild(card);
      });
    }

    function agregarCarrito(titulo) {
      alert(`"${titulo}" agregado al carrito 🛒`);
    }

    function toggleLike(btn) {
      btn.classList.toggle("liked");
    }

    // Cargar fantasía por defecto
    cargarLibros("fantasia");
  