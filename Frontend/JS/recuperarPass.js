// function enviarCorreo() {
//   const correo = document.getElementById("correo").value;

//   fetch("http://localhost:3000/recuperarPass", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json"
//     },
//     body: JSON.stringify({ correo })
//   })
//   .then(res => res.json()) 
//   .then(data => {
//     console.log("DATA:", data); 
//     window.location.href = data.link; // 🔥 REDIRECCIÓN
//   })
//   .catch(error => {
//     console.error("Error:", error);
//   });
// }



function enviarCorreo() {
  const correo = document.getElementById("correo").value;
  const resultado = document.getElementById("resultado");

  fetch("http://localhost:3000/recuperarPass", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ correo })
  })
  .then(res => res.json()) 
  .then(data => {
    console.log("DATA:", data);

    //  Si no existe
    if (!data.link) {
      resultado.innerText = data.mensaje;
      resultado.style.color = "red";
      return;
    }

    //  Si existe → redirige
    resultado.innerText = " redirigiendo...";
    resultado.style.color = "white";

    setTimeout(() => {
      window.location.href = data.link;
    }, 1500);
  })
  .catch(error => {
    console.error("Error:", error);
    resultado.innerText = "Error en el servidor";
    resultado.style.color = "red";
  });
}