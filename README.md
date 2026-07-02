# Saldopilot

Administrador personal de ingresos, gastos, presupuestos, gastos fijos y objetivos de ahorro.

## Ejecutar

```bash
npm install
npm run dev
```

## Publicar en GitHub Pages

Este repositorio incluye un workflow de GitHub Actions que compila la app y publica `dist/` en GitHub Pages al hacer push a `main`, `master` o `work`, y también permite ejecutar el despliegue manualmente desde la pestaña **Actions**.

Para activarlo en GitHub:

1. Ve a **Settings → Pages**.
2. En **Build and deployment**, selecciona **GitHub Actions** como fuente.
3. Ejecuta el workflow **Deploy to GitHub Pages** o haz push a una de las ramas configuradas.

La app usa rutas con hash y `base: './'`, por lo que funciona correctamente tanto en dominios de usuario u organización como en repositorios publicados bajo subruta (`https://usuario.github.io/repositorio/`).
