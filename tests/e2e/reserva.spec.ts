// tests/e2e/reserva.spec.ts — Fase 30
// Cubre el flujo critico: portal publico → reservar cita.
import { test, expect } from '@playwright/test'

test.describe('Flujo de reserva publica', () => {
  test('pagina de inicio carga correctamente', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/FORMA/)
    await expect(page.getByRole('link', { name: /reservar/i }).first()).toBeVisible()
  })

  test('pagina /reservar renderiza el stepper', async ({ page }) => {
    await page.goto('/reservar')
    // Paso 1: seleccion de servicio
    await expect(page.getByText(/elige tu servicio/i).or(page.getByText(/servicio/i)).first()).toBeVisible()
  })

  test('pagina /servicios lista los servicios', async ({ page }) => {
    await page.goto('/servicios')
    await expect(page.getByRole('main')).toBeVisible()
  })

  test('pagina /galeria carga', async ({ page }) => {
    await page.goto('/galeria')
    await expect(page.getByRole('main')).toBeVisible()
  })

  test('pagina /login renderiza formulario', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('button', { name: /iniciar sesion/i }).or(
      page.getByRole('button', { name: /entrar/i })
    ).first()).toBeVisible()
  })

  test('redireccion /admin sin auth lleva a /login', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/login/)
  })

  test('redireccion /cliente sin auth lleva a /login', async ({ page }) => {
    await page.goto('/cliente/mis-citas')
    await expect(page).toHaveURL(/\/login/)
  })

  test('pagina /offline renderiza fallback', async ({ page }) => {
    await page.goto('/offline')
    await expect(page.getByText(/sin conexion/i)).toBeVisible()
  })
})
