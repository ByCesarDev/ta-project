# Plan de Implementación: Sistema Integral de Avatares y Proxy de Privacidad

Este documento detalla la arquitectura, especificación de endpoints y plan de ejecución paso a paso para el sistema de avatares en **TotalAnime 2.0**, incorporando privacidad de origen (ocultando URLs directas de Supabase Storage mediante un proxy seguro en la API), administración completa en el panel Admin y selector interactivo de avatares en el perfil de usuario.

---

## 1. Objetivos y Principios de Diseño

1. **Privacidad Total de Almacenamiento (Proxy de Avatares):**

   - El cliente (navegador, devtools, inspeccionar elemento) **nunca verá la URL directa de Supabase Storage** (`https://<project>.supabase.co/storage/v1/object/public/avatars/...`).
   - Toda imagen de avatar será servida a través de la API propia:`GET /api/v1/avatars/:filename` (ej. `http://localhost:4000/api/v1/avatars/user-1.jpeg`).
   - Implementar cabeceras de caché HTTP agresivas (`Cache-Control: public, max-age=86400, stale-while-revalidate=604800, immutable`) y validación de tipos MIME (`image/png`, `image/jpeg`, `image/webp`).
2. **Gestión de Avatares en Panel Admin (`admin`):**

   - Subida masiva (Dropzone / Drag & Drop) de avatares directamente procesados por la API o Storage.
   - Registro automático en la tabla `public.avatars (id, filename, is_default)`.
   - Establecer avatar predeterminado (`is_default = true`).
   - Eliminación sincronizada (borrado del registro en BD y del archivo en el bucket).
3. **Selector Interactivo en Perfil Web (`web`):**

   - Modal oscuro con diseño glassmorphism al hacer clic en la foto de perfil en [`ProfilePage.tsx`](file:///c:/Users/Usuario/Desktop/Proyectos/totalanime/web/src/pages/ProfilePage.tsx).
   - Cuadrícula de avatares disponibles con selección visual e indicador activo.
   - Actualización inmediata en base de datos (`profiles.avatar_url`) y reactiva en el `AuthContext` (Navbar y Header actualizados sin recargar la página).
4. **Resolución Universal de URLs:**

   - Helper centralizado `getAvatarUrl()` en Web y Admin para evitar URLs relativas rotas (404) y resolver siempre la ruta proxificada.

---

## 2. Diagrama de Arquitectura y Flujo de Datos

```
[ Navegador del Usuario ] 
       │ 
       ├─► 1. <img src="http://localhost:4000/api/v1/avatars/user-1.jpeg" />
       │      (URL privada / sin rastro de Supabase)
       │
[ API Backend (Node.js / Express) ]
       │ 
       ├─► 2. Valida archivo y solicita stream a Supabase Storage
       │      supabaseAdmin.storage.from('avatars').download('user-1.jpeg')
       │ 
[ Supabase Storage (Bucket 'avatars') ]
       │
       └─► 3. Retorna buffer de imagen -> API responde con Content-Type y Cache-Control
```

---

## 3. Especificación de Endpoints en Backend (`api`)

### 3.1. Servir Avatar (Proxy Seguro)

- **Ruta:** `GET /api/v1/avatars/:filename`
- **Autenticación:** Pública.
- **Comportamiento:**
  - Valida el nombre de archivo (evita directory traversal: sanitiza `..` o `/`).
  - Descarga el archivo del bucket `avatars` usando `supabaseAdmin.storage.from('avatars').download(cleanFilename)`.
  - Si el archivo no existe, devuelve el avatar predeterminado (`default-avatar.png`) o un SVG fallback.
  - Configura headers:
    - `Content-Type: image/png` (o `image/jpeg`, `image/webp` según extensión).
    - `Cache-Control: public, max-age=86400, stale-while-revalidate=604800, immutable`.
    - `X-Content-Type-Options: nosniff`.
  - Envía el buffer binario directamente como respuesta.

### 3.2. Listar Avatares Disponibles

- **Ruta:** `GET /api/v1/avatars`
- **Autenticación:** Pública.
- **Respuesta:**
  ```json
  {
    "success": true,
    "avatars": [
      {
        "id": 1,
        "filename": "default-avatar.png",
        "is_default": true,
        "url": "/api/v1/avatars/default-avatar.png"
      },
      {
        "id": 16,
        "filename": "user-1.jpeg",
        "is_default": false,
        "url": "/api/v1/avatars/user-1.jpeg"
      }
    ]
  }
  ```

### 3.3. Subir Nuevos Avatares (Admin)

- **Ruta:** `POST /api/v1/avatars/upload`
- **Autenticación:** Requerida (`role: 'admin' | 'moderator'`).
- **Formato:** `multipart/form-data` (campo `files`).
- **Comportamiento:**
  - Procesa cada imagen, genera un nombre seguro o conserva su identificador único.
  - Sube los archivos al bucket `avatars` de Supabase.
  - Inserta los registros en la tabla `public.avatars`.
  - Retorna la lista de nuevos avatares registrados.

### 3.4. Marcar Avatar como Predeterminado (Admin)

- **Ruta:** `PATCH /api/v1/avatars/:id/default`
- **Autenticación:** Requerida (`role: 'admin' | 'moderator'`).
- **Comportamiento:**
  - Ejecuta una transacción o actualización:
    1. Pone `is_default = false` en todos los avatares.
    2. Pone `is_default = true` en el avatar con ID `:id`.
  - Retorna el avatar actualizado.

### 3.5. Eliminar Avatar (Admin)

- **Ruta:** `DELETE /api/v1/avatars/:id`
- **Autenticación:** Requerida (`role: 'admin'`).
- **Comportamiento:**
  - Obtiene el `filename` del avatar con ID `:id`.
  - Si `is_default = true`, rechaza la eliminación para proteger el avatar base del sistema.
  - Elimina el archivo del bucket `avatars` en Supabase Storage.
  - Elimina el registro de la tabla `public.avatars`.

---

## 4. Módulo de Administración de Avatares (`admin`)

### 4.1. Nueva Página: `admin/src/pages/AvatarsPage.tsx`

- **Cabecera:** Título *"Gestión de Avatares"*, contador total y botón de acción rápida.
- **Zona Dropzone de Subida Múltiple:**
  - Drag & Drop interactivo para arrastrar múltiples imágenes simultáneamente (PNG, JPG, WEBP, máx 2MB).
  - Previsualización en tiempo real con opción de remover antes de subir.
  - Barra de progreso de subida.
- **Cuadrícula de Avatares:**
  - Tarjetas oscuras con previsualización del avatar vía URL proxificada.
  - Badge distintivo *"Por Defecto"* en el avatar predeterminado.
  - Botón *"Predeterminado"* para cambiar el default con 1 clic.
  - Botón *"Eliminar"* con modal de confirmación seguro (bloqueado para el default).

### 4.2. Enlace en Navegación: `admin/src/components/layout/Sidebar.tsx`

- Añadir entrada en la sección de administración:
  - Nombre: *"Avatares"*
  - Ruta: `/avatars`
  - Icono: `UserCircle` o `Smile` de `lucide-react`.

---

## 5. Selector de Avatar en Perfil de Usuario (`web`)

### 5.1. Componente Modal: `web/src/components/profile/AvatarSelectModal.tsx`

- **Diseño:** Modal glassmorphic oscuro con backdrop blur y animaciones fluidas.
- **Contenido:**
  - Cuadrícula responsiva de avatares disponibles obtenidos vía `useAvatars()`.
  - Resaltado con borde brillante e icono de check (`✓`) sobre el avatar seleccionado actualmente.
  - Botón *"Cancelar"* y *"Guardar Avatar"* con estado de carga (`isLoading`).
- **Lógica de Guardado:**
  - Al guardar, ejecuta `supabase.from('profiles').update({ avatar_url: selectedFilename }).eq('id', user.id)`.
  - Actualiza el estado local de `profile` en [`AuthContext.tsx`](file:///c:/Users/Usuario/Desktop/Proyectos/totalanime/web/src/context/AuthContext.tsx) para reflejarse al instante en el Navbar y ProfilePage sin recargar la página.

### 5.2. Interacción en `ProfilePage.tsx`

- El contenedor de la foto de perfil en [`ProfilePage.tsx`](file:///c:/Users/Usuario/Desktop/Proyectos/totalanime/web/src/pages/ProfilePage.tsx) tendrá cursor pointer y un overlay al pasar el mouse con icono de cámara (`Camera` / `Edit3`) y texto *"Cambiar avatar"*.
- Al hacer clic, abre el `AvatarSelectModal`.

---

## 6. Helper Universal `getAvatarUrl` (Web y Admin)

Ubicación: `web/src/lib/utils.ts` y `admin/src/lib/utils.ts`

```ts
export function getAvatarUrl(avatarPathOrUrl?: string | null): string {
  const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  const apiBase = rawApiUrl.endsWith('/api/v1') ? rawApiUrl : `${rawApiUrl}/api/v1`;

  if (!avatarPathOrUrl || avatarPathOrUrl.trim() === '') {
    return `${apiBase}/avatars/default-avatar.png`;
  }

  // Si ya es una URL externa de proxy o proveedor OAuth
  if (avatarPathOrUrl.startsWith('http://') || avatarPathOrUrl.startsWith('https://')) {
    // Si contiene la URL cruda de Supabase Storage, convertirla a la ruta proxy
    if (avatarPathOrUrl.includes('/storage/v1/object/public/avatars/')) {
      const filename = avatarPathOrUrl.split('/storage/v1/object/public/avatars/')[1];
      return `${apiBase}/avatars/${filename}`;
    }
    return avatarPathOrUrl;
  }

  // Si es un nombre de archivo local (ej. 'user-1.jpeg' o 'default-avatar.png')
  return `${apiBase}/avatars/${avatarPathOrUrl}`;
}
```

---

## 7. Fases de Implementación y Checklist de Progreso

- [x] **Fase 1: Backend (`api`) - Proxy de Avatares y CRUD de Administración**
  - [x] Implementar `api/src/services/avatar.service.ts` (stream de imágenes desde Storage con headers de caché, listar, subir, predeterminado, eliminar).
  - [x] Implementar `api/src/controllers/avatar.controller.ts` y middleware de carga multipart con `multer`.
  - [x] Registrar rutas en `api/src/routes/avatar.routes.ts` y montar en `/api/v1/avatars`.
  - [x] Crear pruebas unitarias e integración en `api/tests/avatar.test.ts`.

- [x] **Fase 2: Helper Universal y Corrección de Imágenes Rotas (Web & Admin)**
  - [x] Implementar `getAvatarUrl(avatarPathOrUrl)` en `web/src/lib/utils.ts` y `admin/src/lib/utils.ts`.
  - [x] Actualizar `web/src/components/layout/Navbar.tsx` y `web/src/pages/ProfilePage.tsx`.
  - [x] Actualizar `admin/src/components/layout/Header.tsx`, `admin/src/pages/UsersPage.tsx` y `admin/src/pages/AuditLogsPage.tsx`.

- [x] **Fase 3: Panel Admin - Gestión de Avatares (`admin`)**
  - [x] Crear hook `admin/src/hooks/useAvatars.ts` para consultas y mutaciones (listar, subir, predeterminado, eliminar).
  - [x] Crear página `admin/src/pages/AvatarsPage.tsx` con Dropzone Drag & Drop múltiple y cuadrícula de gestión.
  - [x] Añadir ruta `/avatars` en `admin/src/App.tsx` y enlace con icono en `admin/src/components/layout/Sidebar.tsx`.

- [x] **Fase 4: Web - Selector Modal de Avatares en el Perfil (`web`)**
  - [x] Crear hook `web/src/hooks/useAvatars.ts` para obtener avatares disponibles.
  - [x] Crear componente `web/src/components/profile/AvatarSelectModal.tsx` con diseño Dark Glassmorphism.
  - [x] Integrar avatar interactivo (hover con icono de edición) en `web/src/pages/ProfilePage.tsx`.
  - [x] Conectar actualización de `profiles.avatar_url` y refresco reactivo de `AuthContext`.

- [x] **Fase 5: Validación, Pruebas y Compilación Limpia**
  - [x] Ejecutar suite de pruebas de la API con Vitest (77 pruebas pasando).
  - [x] Compilar `api`, `web` y `admin` con 0 errores TypeScript/Vite.

