# Comentarios con login de Discord para ametium.dev

## Antes que nada: arreglé tu vercel.json
El que tenías redirigía TODO (incluyendo `/api/*`) hacia `/home/index.html`, un
archivo que no existe en tu repo (tu `index.html` está en la raíz). Con esa
regla, ninguna llamada a `/api/comments`, `/api/session`, etc. habría
funcionado nunca: Vercel las habría contestado con esa redirección rota antes
de que llegaran a las funciones. Lo dejé así de simple:
adsdas21
```json 
{ "cleanUrls": true }
```

`cleanUrls` ya sirve `index.html` en `/` sin necesitar una regla explícita, y
Vercel detecta solo la carpeta `api/` como funciones. Si algún día quieres
usar rutas tipo `/download` sin `.html`, `cleanUrls` también te las da gratis
mientras el archivo se llame `download.html`.

## 1. App de Discord
1. https://discord.com/developers/applications → crea una aplicación (o usa una que ya tengas).
2. OAuth2 → Redirects, agrega: `https://ametium.dev/api/auth/callback`
3. Copia el **Client ID** y el **Client Secret**.

## 2. Base de datos
Una base gratis en https://neon.tech y copia el connection string (botón "Connect").

## 3. Variables de entorno en Vercel
Project → Settings → Environment Variables:
- `DISCORD_CLIENT_ID`
- `DISCORD_CLIENT_SECRET`
- `DATABASE_URL` — el connection string de Neon
- `SETUP_DB_TOKEN` — invéntate una clave larga random, solo tú la vas a usar

## 4. Subir esto a GitHub
Sube TODO el contenido de esta carpeta a tu repo `AmetiumDevelopment`, reemplazando
lo que ya tienes (respeta la carpeta `api/`). Espera a que Vercel termine de
desplegar solo, en cuanto detecte el push.

## 5. Crear las tablas (una sola vez)
Entra a:
`https://ametium.dev/api/setup-db?token=LA_CLAVE_QUE_PUSISTE_EN_SETUP_DB_TOKEN`
y dale click a "Ejecutar". Sin el token correcto esa ruta responde 404, como si no existiera.

## Listo
Entra a `https://ametium.dev/#comentarios`, inicia sesión con Discord y prueba a
publicar uno.

## Cómo funciona
- Cualquiera puede leer los comentarios, sin iniciar sesión.
- Para publicar hace falta iniciar sesión con Discord (no hace falta estar en tu
  servidor, solo tener cuenta).
- Una cuenta de Discord = un comentario. Lo obliga la propia base de datos
  (`unique` en `discord_id`), no solo el código, así que no se cuelan dos aunque
  lleguen al mismo tiempo.
- Si alguien borra su comentario puede escribir uno nuevo.
- 500 caracteres máximo, y el texto se escapa al mostrarse: nadie mete HTML ni
  scripts en su comentario.
- El id de sesión se guarda como hash en la base de datos, nunca en texto plano.
