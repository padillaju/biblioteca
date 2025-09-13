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
    document.getElementById('mensaje').textContent = data.message;

    if (data.success) {
      setTimeout(() => {
        window.location.href = "/HTML/Inicio.html";
      }, 2000);
    }

  } catch (error) {
    console.error("Error:", error);
    document.getElementById('mensaje').textContent = "Error en la conexión";
  }
});
