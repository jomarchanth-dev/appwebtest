const lista = document.getElementById("lista-productos");
const estado = document.getElementById("estado");

function formatearPrecio(valor) {
  return "$" + valor.toLocaleString("es-CL");
}

function crearTarjeta(producto) {
  const li = document.createElement("li");
  li.className = "producto";
  li.dataset.id = producto.id;

  const nombre = document.createElement("h2");
  nombre.textContent = producto.nombre;

  const descripcion = document.createElement("p");
  descripcion.textContent = producto.descripcion;

  const precio = document.createElement("p");
  precio.className = "precio";
  precio.textContent = formatearPrecio(producto.precio);

  const stock = document.createElement("p");
  stock.className = "stock";
  stock.textContent = producto.stock > 0 ? `Stock: ${producto.stock}` : "Sin stock";

  li.append(nombre, descripcion, precio, stock);
  return li;
}

async function cargarProductos() {
  try {
    const respuesta = await fetch("/api/productos");
    if (!respuesta.ok) throw new Error("respuesta no válida");
    const productos = await respuesta.json();

    if (productos.length === 0) {
      estado.textContent = "No hay productos disponibles.";
      return;
    }

    estado.remove();
    productos.forEach((p) => lista.appendChild(crearTarjeta(p)));
  } catch (err) {
    estado.textContent = "No se pudieron cargar los productos.";
  }
}

cargarProductos();
