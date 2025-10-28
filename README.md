# Cloud Chat (Firebase + GitHub Pages)

Chat web **estático** (HTML/CSS/JS) que se hospeda en **GitHub Pages** y usa **Firebase** como backend (Auth + Firestore) para mensajes en tiempo real.

> Ideal como demo de “aplicaciones en la nube” sin servidores propios.

## Características
- Registro e ingreso con **Email/Password** (Firebase Authentication).
- Sala `#general` en tiempo real con **Firestore**.
- UI limpia, responsive, con enfoque accesible.
- Sin servidores: solo archivos estáticos y servicios gestionados.

## Requisitos
- Cuenta en [Firebase](https://firebase.google.com/).
- Repositorio en GitHub para publicar con **GitHub Pages**.

## Pasos de configuración (10 minutos)
1. **Crear proyecto Firebase** → `Add app` → `Web`.
2. Copia la **configuración web** (apiKey, authDomain, projectId, etc.).
3. En **Authentication → Sign-in method**, habilita **Email/Password**.
4. En **Firestore Database**, crea una base en modo **production** (puedes empezar en test y luego ajustar reglas).
5. **Reglas de Firestore** (mínimas seguras para demo):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /messages/{doc} {
      allow read: if request.auth != null;
      allow create: if request.auth != null
                    && request.resource.data.text is string
                    && request.resource.data.text.size() <= 1000
                    && request.resource.data.createdAt is timestamp
                    && request.resource.data.uid == request.auth.uid;
      allow update, delete: if false; // no se permite editar/borrar
    }
  }
}
```

6. En `app.js`, pega tu `firebaseConfig`.
7. **Publica en GitHub Pages**: ve a *Settings → Pages* y selecciona la rama que contenga estos archivos (por ejemplo `main` y carpeta `/ (root)`).
8. Abre tu URL de Pages (p.ej., `https://tuusuario.github.io/cloud-chat/`), regístrate e inicia sesión. ¡Listo!

## Estructura del proyecto
```
cloud-chat/
├─ index.html
├─ styles.css
├─ app.js
└─ README.md
```

## Notas de seguridad
- Mantén las **reglas** de Firestore estrictas (solo usuarios autenticados).
- Este ejemplo usa una **única sala global**. Para múltiples salas, añade colección `rooms/{roomId}/messages`.
- Si esperas tráfico alto, añade paginación / límites y considera moderación (p. ej. filtro de lenguaje).

## Extensiones sugeridas
- Perfil con avatar (Firebase Storage).
- Soporte de proveedores sociales (Google, GitHub).
- Lista de usuarios conectados (Realtime Database + presence).
- Múltiples canales / mensajes privados.

---

Hecho con ❤️ para fines educativos.
