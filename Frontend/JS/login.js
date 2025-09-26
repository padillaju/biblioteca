document.getElementById('formLogin').addEventListener('submit', async (e) => {
  e.preventDefault();

  const correo = document.getElementById('correo').value;
  const contrasena = document.getElementById('contrasena').value;

  try {
    const res = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, contrasena })
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
        direccion: data.direccion
    }));
    setTimeout(() => {
        window.location.href = "/HTML/Inicio.html";
    }, 2000);
}

  } catch (error) {
    console.error("Error:", error);
    document.getElementById('mensaje').textContent = "Error en la conexión";
  }
});
