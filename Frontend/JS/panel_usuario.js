
    // Simulación de datos
    const datos = {
      favoritos: [
        {titulo: "Cien años de soledad", autor: "Gabriel García Márquez"},
        {titulo: "Don Quijote de la Mancha", autor: "Miguel de Cervantes"},
        {titulo: "Rayuela", autor: "Julio Cortázar"}
      ],
      comprados: [
        {titulo: "El principito", autor: "Antoine de Saint-Exupéry"},
        {titulo: "1984", autor: "George Orwell"}
      ],
      carrito: [
        {titulo: "La sombra del viento", autor: "Carlos Ruiz Zafón"}
      ],
      categorias: [
        {titulo: "Fantasía", autor: "Ejemplo"},
        {titulo: "Ciencia Ficción", autor: "Ejemplo"},
        {titulo: "Historia", autor: "Ejemplo"},
        {titulo: "Romance", autor: "Ejemplo"}
      ]
    };

    function mostrar(seccion) {
      document.getElementById("titulo").innerText = 
        seccion.charAt(0).toUpperCase() + seccion.slice(1);

      const contenedor = document.getElementById("contenido");
      contenedor.innerHTML = "";

      datos[seccion].forEach(item => {
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
          <h3>${item.titulo}</h3>
          <p>${item.autor}</p>
        `;
        contenedor.appendChild(card);
      });
    }

    // Mostrar favoritos por defecto
    mostrar("favoritos");
  