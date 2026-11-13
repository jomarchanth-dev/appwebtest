import { test, expect, Page } from '@playwright/test';

// Usuarios de prueba de la webapp local (ver Webapp_local/server.js).
const ADMIN = { usuario: 'admin', password: 'Admin123!' };
const CLIENTE_1 = { usuario: 'cliente1', password: 'Cliente1!' };

async function iniciarSesion(page: Page, usuario: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('Usuario').fill(usuario);
  await page.getByLabel('Contraseña').fill(password);
  await page.getByRole('button', { name: 'Ingresar' }).click();
}

test.describe('Login', () => {
  test('muestra error si se envía el formulario vacío', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Ingresar' }).click();

    await expect(page.getByRole('alert')).toHaveText('Ingresa usuario y contraseña');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('muestra mensaje genérico con contraseña incorrecta', async ({ page }) => {
    await iniciarSesion(page, ADMIN.usuario, 'clave-incorrecta');

    await expect(page.getByRole('alert')).toHaveText('Usuario o contraseña incorrectos');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('muestra mensaje genérico con usuario inexistente', async ({ page }) => {
    await iniciarSesion(page, 'usuario-que-no-existe', 'cualquiera');

    await expect(page.getByRole('alert')).toHaveText('Usuario o contraseña incorrectos');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('administrador entra a inicio con rol administrador y ve el enlace al mantenedor', async ({ page }) => {
    await iniciarSesion(page, ADMIN.usuario, ADMIN.password);

    await expect(page).toHaveURL(/\/inicio$/);
    await expect(page.locator('#usuario-actual')).toHaveText(ADMIN.usuario);
    await expect(page.locator('#rol-actual')).toHaveText('administrador');
    await expect(page.getByRole('link', { name: 'Ir al mantenedor de productos' })).toBeVisible();
  });

  test('cliente entra a inicio con rol cliente y no ve el enlace al mantenedor', async ({ page }) => {
    await iniciarSesion(page, CLIENTE_1.usuario, CLIENTE_1.password);

    await expect(page).toHaveURL(/\/inicio$/);
    await expect(page.locator('#usuario-actual')).toHaveText(CLIENTE_1.usuario);
    await expect(page.locator('#rol-actual')).toHaveText('cliente');
    await expect(page.getByRole('link', { name: 'Ir al mantenedor de productos' })).toBeHidden();
  });

  test('cerrar sesión vuelve al login', async ({ page }) => {
    await iniciarSesion(page, CLIENTE_1.usuario, CLIENTE_1.password);
    await expect(page).toHaveURL(/\/inicio$/);

    await page.getByRole('button', { name: 'Cerrar sesión' }).click();

    await expect(page).toHaveURL(/\/login$/);
  });
});

test.describe('Protección de rutas', () => {
  test('sin sesión, /inicio redirige al login', async ({ page }) => {
    await page.goto('/inicio');

    await expect(page).toHaveURL(/\/login$/);
  });

  test('sin sesión, /admin redirige al login', async ({ page }) => {
    await page.goto('/admin');

    await expect(page).toHaveURL(/\/login$/);
  });

  test('cliente no puede entrar a /admin y recibe 403', async ({ page }) => {
    await iniciarSesion(page, CLIENTE_1.usuario, CLIENTE_1.password);
    await expect(page).toHaveURL(/\/inicio$/);

    const respuesta = await page.goto('/admin');

    expect(respuesta?.status()).toBe(403);
    await expect(page.getByRole('heading', { name: '403 - Acceso denegado' })).toBeVisible();
  });

  test('administrador sí puede entrar a /admin', async ({ page }) => {
    await iniciarSesion(page, ADMIN.usuario, ADMIN.password);
    await expect(page).toHaveURL(/\/inicio$/);

    const respuesta = await page.goto('/admin');

    expect(respuesta?.status()).toBe(200);
    await expect(page.getByRole('heading', { name: 'Nuevo producto' })).toBeVisible();
  });
});
