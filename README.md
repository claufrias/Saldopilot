# Saldopilot

Administrador personal de ingresos, gastos, presupuestos, gastos fijos y objetivos de ahorro.

## Ejecutar

```bash
npm install
cp .env.example .env
npm run dev
```

## Supabase

Saldopilot sincroniza la información entre dispositivos usando Supabase. Las variables de Supabase son obligatorias para iniciar sesión y guardar datos.

1. En Supabase, copia la **Project URL** base. Debe tener este formato: `https://tu-proyecto.supabase.co`. No uses la URL con `/rest/v1/`.
2. En **Settings → API Keys**, copia la **Publishable key** (`sb_publishable_...`). No uses una secret key ni service role key en el navegador.
3. En Supabase SQL Editor, ejecuta `supabase/schema.sql` para crear la tabla `user_app_states` y sus políticas RLS.
4. En Supabase Auth, agrega estas URLs en la configuración de autenticación:
   - `http://localhost:5173/`
   - `https://claufrias.github.io/Saldopilot/`
5. Para desarrollo local, crea `.env` con:

```bash
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_tu_key
```

6. Para GitHub Pages, agrega esas mismas claves como **Repository variables** en **Settings → Secrets and variables → Actions → Variables**.

### Si el login muestra "Failed to fetch"

Ese error suele indicar que el navegador no pudo conectarse a Supabase. Revisa que `VITE_SUPABASE_URL` sea la **Project URL** base (`https://tu-proyecto.supabase.co`), que no tenga `/rest/v1/` ni `/auth/v1/`, que no sean los valores de ejemplo de `.env.example`, y vuelve a ejecutar el workflow de GitHub Pages para reconstruir la app con las variables reales.

## Publicar en GitHub Pages

Este repositorio incluye un workflow de GitHub Actions que compila la app y publica `dist/` en GitHub Pages al hacer push a `main`, `master` o `work`, y también permite ejecutar el despliegue manualmente desde la pestaña **Actions**.

Para activarlo en GitHub:

1. Ve a **Settings → Pages**.
2. En **Build and deployment**, selecciona **GitHub Actions** como fuente.
3. Ejecuta el workflow **Deploy to GitHub Pages** o haz push a una de las ramas configuradas.

El workflow calcula `VITE_BASE_PATH` antes de compilar para que Vite genere rutas de assets compatibles con GitHub Pages: `/` en repositorios `*.github.io` y `/<repositorio>/` en repositorios publicados bajo subruta. En desarrollo local se mantiene `base: './'` por defecto.
