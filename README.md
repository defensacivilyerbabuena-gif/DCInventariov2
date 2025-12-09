
# Sistema de Inventario Defensa Civil Yerba Buena

Este proyecto es una aplicación de gestión de inventario y préstamos construida con React, TypeScript, Vite, Tailwind CSS y Supabase.

## 🚀 Tecnologías

*   **Frontend:** React 18, Vite, Tailwind CSS.
*   **Backend / Base de Datos:** Supabase (PostgreSQL, Auth, Realtime).
*   **IA:** Google Gemini API (para el asistente virtual).

## ⚡ IMPORTANTE: Configuración de Base de Datos (Supabase)

Para inicializar la base de datos, utiliza el código que se encuentra en el archivo:

**`supabase_setup.sql`**

1.  Abre el archivo `supabase_setup.sql` de este proyecto.
2.  Copia todo su contenido.
3.  Ve al **"SQL Editor"** en tu proyecto de Supabase.
4.  Pega el código y ejecútalo (Click en "Run").

Esto creará todas las tablas necesarias (usuarios, ítems, solicitudes) y configurará los permisos de seguridad.

## 🛠️ Instalación y Despliegue

### Pasos para Despliegue en Netlify

1.  **Descargar Código:** Descarga los archivos de este proyecto.
2.  **GitHub:** Sube los archivos a un nuevo repositorio público o privado en GitHub.
3.  **Netlify:**
    *   Crea una cuenta en [Netlify](https://www.netlify.com/).
    *   Selecciona "Import from Git" -> GitHub -> Tu Repositorio.
    *   Configura el comando de build: `npm run build` y directorio de salida: `dist`.
    *   **Variables de entorno:** En la configuración del sitio en Netlify ("Site configuration" > "Environment variables"), agrega:
        *   `VITE_SUPABASE_URL`: (Tu URL de proyecto Supabase)
        *   `VITE_SUPABASE_ANON_KEY`: (Tu clave pública 'anon' de Supabase)
        *   `API_KEY`: (Opcional, si usas Gemini IA)

## 🔐 Gestión de Usuarios y Roles

*   **Registro:** Los nuevos usuarios se registran con email y contraseña desde la app. Automáticamente tendrán rol 'USER'.
*   **Asignar Administrador:**
    1.  Ve a tu proyecto en Supabase -> Table Editor -> `profiles`.
    2.  Busca tu usuario.
    3.  Cambia la columna `role` de `USER` a `ADMIN`.
    4.  Refresca la aplicación.