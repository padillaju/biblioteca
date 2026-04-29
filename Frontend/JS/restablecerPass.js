// Obtener token de la URL
const params = new URLSearchParams(window.location.search);
const token = params.get("token");

// 👁️ Mostrar / ocultar contraseña
function togglePass(id, btn) {
  const input = document.getElementById(id);
  const icon = btn.querySelector("i");

  if (input.type === "password") {
    input.type = "text";
    icon.classList.remove("fa-eye");
    icon.classList.add("fa-eye-slash");
  } else {
    input.type = "password";
    icon.classList.remove("fa-eye-slash");
    icon.classList.add("fa-eye");
  }
}

function cambiarPassword() {
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  const mensaje = document.getElementById("mensaje");

  // Validación
  if (password !== confirmPassword) {
    mensaje.innerText = "Las contraseñas no coinciden";
    mensaje.style.color = "red";
    return;
  }

  fetch("http://localhost:3000/resetPassword", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ token, password })
  })
  .then(res => res.json())
  .then(data => {
    mensaje.innerText = data.mensaje;

    // éxito → blanco + redirección
    if (data.mensaje.toLowerCase().includes("correctamente")) {
      mensaje.style.color = "white";

      setTimeout(() => {
        window.location.href = "login.html";
      }, 2000); // 2 segundos
    } else {
      mensaje.style.color = "red";
    }
  })
  .catch(err => {
    console.error(err);
    mensaje.innerText = "Error en el servidor";
    mensaje.style.color = "red";
  });
}