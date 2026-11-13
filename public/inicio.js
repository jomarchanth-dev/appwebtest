async function cargarSesion() {
  const respuesta = await fetch("/api/sesion");
  if (!respuesta.ok) {
    window.location.href = "/login";
    return;
  }
  const datos = await respuesta.json();
  document.getElementById("usuario-actual").textContent = datos.usuario;
  document.getElementById("rol-actual").textContent = datos.rol;
  document.getElementById("enlace-admin").hidden = datos.rol !== "administrador";
}

document.getElementById("btn-logout").addEventListener("click", async () => {
  await fetch("/api/logout", { method: "POST" });
  window.location.href = "/login";
});

cargarSesion();
