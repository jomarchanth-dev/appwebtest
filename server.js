const fs = require("fs");
const path = require("path");
const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");

const PORT = Number(process.env.PORT) || 3000;
const app = express();

// ---------------------------------------------------------------
// Usuarios de prueba (en memoria). Las contraseñas se guardan con hash.
// ---------------------------------------------------------------
const USUARIOS = [
  { usuario: "admin", passwordHash: bcrypt.hashSync("Admin123!", 10), rol: "administrador" },
  { usuario: "cliente1", passwordHash: bcrypt.hashSync("Cliente1!", 10), rol: "cliente" },
  { usuario: "cliente2", passwordHash: bcrypt.hashSync("Cliente2!", 10), rol: "cliente" },
];

// ---------------------------------------------------------------
// Productos: se cargan desde data/productos.json y se guardan en el mismo
// archivo cada vez que se crea uno. Si el archivo no existe, se crea con
// estos productos iniciales.
// ---------------------------------------------------------------
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "productos.json");

const PRODUCTOS_INICIALES = [
  { id: 1, nombre: "Audífonos inalámbricos", descripcion: "Bluetooth, 20 horas de batería", precio: 39990, stock: 12 },
  { id: 2, nombre: "Teclado mecánico", descripcion: "Switches rojos, retroiluminado", precio: 54990, stock: 5 },
  { id: 3, nombre: "Mouse ergonómico", descripcion: "Conexión USB, 6 botones", precio: 19990, stock: 0 },
  { id: 4, nombre: "Monitor 24 pulgadas", descripcion: "Full HD, 75 Hz", precio: 129990, stock: 3 },
  { id: 5, nombre: "Cable USB-C", descripcion: "1 metro, carga rápida", precio: 4990, stock: 40 },
];

function cargarProductos() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    }
  } catch (err) {
    console.error("No se pudo leer data/productos.json:", err.message);
  }
  return structuredClone(PRODUCTOS_INICIALES);
}

function guardarProductos() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(PRODUCTOS, null, 2), "utf8");
}

const PRODUCTOS = cargarProductos();
if (!fs.existsSync(DATA_FILE)) {
  guardarProductos();
}

app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "practica-ci-cd-dev",
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: "lax" },
  })
);
app.use(express.static(path.join(__dirname, "public")));

// Middleware: exige sesión iniciada para la ruta.
function requiereSesion(req, res, next) {
  if (!req.session.usuario) {
    return res.redirect("/login");
  }
  next();
}

// Middleware: exige sesión y un rol determinado. Sin sesión -> login; rol incorrecto -> 403.
function requiereRol(rol) {
  return (req, res, next) => {
    if (!req.session.usuario) {
      return res.redirect("/login");
    }
    if (req.session.rol !== rol) {
      return res.status(403).send(
        '<!doctype html><html lang="es"><meta charset="utf-8"><title>Acceso denegado</title>' +
          '<body style="font-family:system-ui;padding:2rem"><h1>403 - Acceso denegado</h1>' +
          '<p>Tu rol no permite ver esta página.</p><a href="/inicio">Volver al inicio</a></body></html>'
      );
    }
    next();
  };
}

// ---------------------------------------------------------------
// Rutas técnicas
// ---------------------------------------------------------------
app.get("/health", (req, res) => {
  res.json({ estado: "ok", version: require("./package.json").version });
});

// ---------------------------------------------------------------
// Login / logout
// ---------------------------------------------------------------
app.get("/", (req, res) => {
  res.redirect("/catalogo");
});

// ---------------------------------------------------------------
// Catálogo público (sin login)
// ---------------------------------------------------------------
app.get("/api/productos", (req, res) => {
  res.json(PRODUCTOS);
});

app.get("/catalogo", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "catalogo.html"));
});

// ---------------------------------------------------------------
// Alta de productos (solo administrador). Edición y eliminación: Incremento 5.
// ---------------------------------------------------------------
app.post("/api/productos", requiereRolApi("administrador"), (req, res) => {
  const { nombre, descripcion, precio, stock } = req.body || {};
  const errores = [];

  if (typeof nombre !== "string" || nombre.trim() === "") errores.push("El nombre es obligatorio");
  if (typeof descripcion !== "string") errores.push("La descripción no es válida");
  if (typeof precio !== "number" || !Number.isInteger(precio) || precio <= 0) {
    errores.push("El precio debe ser un número entero mayor que cero");
  }
  if (typeof stock !== "number" || !Number.isInteger(stock) || stock < 0) {
    errores.push("El stock debe ser un número entero, mayor o igual a cero");
  }
  if (errores.length > 0) {
    return res.status(400).json({ ok: false, mensaje: errores.join(". ") });
  }

  const id = PRODUCTOS.reduce((max, p) => Math.max(max, p.id), 0) + 1;
  const producto = { id, nombre: nombre.trim(), descripcion: descripcion.trim(), precio, stock };
  PRODUCTOS.push(producto);
  guardarProductos();
  res.status(201).json({ ok: true, producto });
});

// Variante de requiereRol para rutas de API: responde JSON en vez de redirigir.
function requiereRolApi(rol) {
  return (req, res, next) => {
    if (!req.session.usuario) {
      return res.status(401).json({ ok: false, mensaje: "Sesión no iniciada" });
    }
    if (req.session.rol !== rol) {
      return res.status(403).json({ ok: false, mensaje: "Acceso denegado" });
    }
    next();
  };
}

app.get("/login", (req, res) => {
  if (req.session.usuario) return res.redirect("/inicio");
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.post("/api/login", (req, res) => {
  const { usuario, password } = req.body || {};
  const encontrado = USUARIOS.find((u) => u.usuario === usuario);

  // Mensaje genérico: no revela si falló el usuario o la contraseña.
  const credencialesValidas =
    encontrado && typeof password === "string" && bcrypt.compareSync(password, encontrado.passwordHash);

  if (!credencialesValidas) {
    return res.status(401).json({ ok: false, mensaje: "Usuario o contraseña incorrectos" });
  }

  req.session.regenerate((err) => {
    if (err) return res.status(500).json({ ok: false, mensaje: "Error interno" });
    req.session.usuario = encontrado.usuario;
    req.session.rol = encontrado.rol;
    res.json({ ok: true, usuario: encontrado.usuario, rol: encontrado.rol });
  });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

app.get("/api/sesion", (req, res) => {
  if (!req.session.usuario) return res.status(401).json({ ok: false });
  res.json({ ok: true, usuario: req.session.usuario, rol: req.session.rol });
});

// ---------------------------------------------------------------
// Página protegida (placeholder hasta el Incremento 3)
// ---------------------------------------------------------------
app.get("/inicio", requiereSesion, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "inicio.html"));
});

// ---------------------------------------------------------------
// Ruta solo para administrador (placeholder hasta el Incremento 5)
// ---------------------------------------------------------------
app.get("/admin", requiereRol("administrador"), (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.listen(PORT, () => {
  console.log(`Webapp local escuchando en http://localhost:${PORT}`);
});
