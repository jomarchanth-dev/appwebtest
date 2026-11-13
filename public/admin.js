const form = document.getElementById("form-producto");
const mensaje = document.getElementById("mensaje");
const cuerpoTabla = document.querySelector("#tabla-productos tbody");

function mostrarMensaje(texto) {
  mensaje.textContent = texto;
  mensaje.hidden = false;
}

function agregarFila(p) {
  const tr = document.createElement("tr");
  [p.id, p.nombre, "$" + p.precio.toLocaleString("es-CL"), p.stock].forEach((valor) => {
    const td = document.createElement("td");
    td.textContent = valor;
    tr.appendChild(td);
  });
  cuerpoTabla.appendChild(tr);
}

async function cargarTabla() {
  const respuesta = await fetch("/api/productos");
  const productos = await respuesta.json();
  cuerpoTabla.innerHTML = "";
  productos.forEach(agregarFila);
}

form.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  mensaje.hidden = true;

  const datos = {
    nombre: document.getElementById("nombre").value.trim(),
    descripcion: document.getElementById("descripcion").value.trim(),
    precio: Number(document.getElementById("precio").value),
    stock: Number(document.getElementById("stock").value),
  };

  try {
    const respuesta = await fetch("/api/productos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    });
    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      mostrarMensaje(resultado.mensaje || "No fue posible crear el producto");
      return;
    }

    form.reset();
    document.getElementById("nombre").focus();
    await cargarTabla();
  } catch (err) {
    mostrarMensaje("Error de conexión con el servidor");
  }
});

cargarTabla();
