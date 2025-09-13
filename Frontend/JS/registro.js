document.getElementById('formRegistro').addEventListener('submit', async (e) => {
  e.preventDefault();

  const nombre = document.getElementById('nombre').value;
  const correo = document.getElementById('correo').value;
  const contrasena = document.getElementById('contrasena').value;
  const celular = document.getElementById('celular').value;
  const direccion = document.getElementById('direccion').value;

  try {
    const res = await fetch('/registro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, correo, contrasena, celular, direccion })
    });

    const data = await res.json(); // 👈 aquí procesamos la respuesta del backend
   

    
    if (res.ok && data.success) {
      alert(data.mensaje); 
      setTimeout(() => {
        window.location.href = "/login.html"; // redirige al login
      }, 2000);
    } else {
      alert(data.mensaje || "Ocurrió un error en el registro");
    }

  } catch (error) {
    console.error("Error:", error);
    alert("Error de conexión con el servidor");
  }
});
