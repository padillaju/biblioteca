// Prevenir navegación hacia atrás desde la página de login
// Si el usuario viene de una página protegida después del logout, asegurar que no pueda volver
window.addEventListener('pageshow', function(event) {
    // Si la página se carga desde el caché (botón atrás), limpiar todo
    if (event.persisted) {
        // Limpiar localStorage y sessionStorage
        localStorage.clear();
        sessionStorage.clear();
        
        // Limpiar cookies
        document.cookie.split(";").forEach(function(c) {
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
        
        // Verificar si hay sesión activa
        fetch("http://localhost:3000/check-session?" + Date.now(), {
            method: "GET",
            credentials: "include",
            cache: "no-store"
        })
        .then(response => response.json())
        .then(data => {
            // Si hay sesión activa pero estamos en login, redirigir según el rol
            if (data.success && data.isAuthenticated) {
                const isAdmin = localStorage.getItem("isAdmin") === "true";
                if (isAdmin) {
                    window.location.replace("/HTML/admin.html?nocache=" + Date.now());
                } else {
                    window.location.replace("/HTML/Inicio.html?nocache=" + Date.now());
                }
            } else {
                // No hay sesión, asegurar que estamos en login limpio
                localStorage.clear();
                sessionStorage.clear();
                window.history.replaceState(null, "", "login.html?nocache=" + Date.now());
            }
        })
        .catch(error => {
            console.error("Error al verificar sesión:", error);
            // En caso de error, limpiar todo y quedarse en login
            localStorage.clear();
            sessionStorage.clear();
            window.history.replaceState(null, "", "login.html?nocache=" + Date.now());
        });
    }
});

// Limpiar historial cuando se carga la página de login después del logout
if (window.location.search.includes('logout=') || window.location.search.includes('session=')) {
    // Reemplazar el historial para que no se pueda volver atrás
    window.history.replaceState(null, "", window.location.href);
    
    // Agregar listener para prevenir navegación hacia atrás
    window.addEventListener('popstate', function(event) {
        // Si intenta ir atrás, redirigir al login de nuevo
        window.history.pushState(null, "", "login.html?back=prevented&nocache=" + Date.now());
        window.location.replace("login.html?back=prevented&nocache=" + Date.now());
    });
    
    // Agregar entrada adicional al historial
    window.history.pushState(null, "", window.location.href);
}

document.getElementById('formLogin').addEventListener('submit', async (e) => {
  e.preventDefault();

  const correo = document.getElementById('correo').value;
  const contrasena = document.getElementById('contrasena').value;

  try {
    const res = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, contrasena }),
      cache: "no-store"
    });

    const data = await res.json();
    console.log("Respuesta del backend:", data); 
    document.getElementById('mensaje').textContent = data.message;

   if (data.success) {
    // Guarda los datos del usuario en localStorage
    localStorage.setItem("userSession", JSON.stringify({
        nombre: data.nombre,
        email: data.correo,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.nombre)}`,
        telefono: data.telefono,
        direccion: data.direccion,
        rol: data.rol
    }));

     localStorage.setItem("isAdmin", data.rol === "admin" ? "true" : "false");

    // Limpiar historial antes de redirigir
    window.history.replaceState(null, "", window.location.href);

    setTimeout(() => {
    if (data.rol === "admin") {
          // Redirigir sin permitir volver atrás
          window.history.replaceState(null, "", "/HTML/admin.html?nocache=" + Date.now());
          window.location.replace("/HTML/admin.html?nocache=" + Date.now());
        } else {
          // Redirigir sin permitir volver atrás
          window.history.replaceState(null, "", "/HTML/Inicio.html?nocache=" + Date.now());
          window.location.replace("/HTML/Inicio.html?nocache=" + Date.now());
        }
      }, 2000);
    }

  } catch (error) {
    console.error("Error:", error);
    document.getElementById('mensaje').textContent = "Error en la conexión";
  }
});
