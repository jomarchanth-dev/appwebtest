const form = document.getElementById("form-login");
const errorP = document.getElementById("error");

form.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  errorP.hidden = true;

  const usuario = document.getElementById("usuario").value.trim();
  const password = document.getElementById("password").value;

  if (!usuario || !password) {
    errorP.textContent = "Ingresa usuario y contraseña";
    errorP.hidden = false;
    return;
  }

  try {
    const respuesta = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario, password }),
    });
    const datos = await respuesta.json();

    if (!respuesta.ok) {
      errorP.textContent = datos.mensaje || "No fue posible iniciar sesión";
      errorP.hidden = false;
      return;
    }

    window.location.href = "/inicio";
  } catch (err) {
    errorP.textContent = "Error de conexión con el servidor";
    errorP.hidden = false;
  }
});
