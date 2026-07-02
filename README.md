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

El workflow calcula `VITE_BASE_PATH` antes de compilar para que Vite genere rutas de assets compatibles con GitHub Pages: `/` en repositorios `*.github.io` y `/<repositorio>/` en repositorios publicados bajo subruta. En desarrollo local se mantiene `base: './'` por defecto.
