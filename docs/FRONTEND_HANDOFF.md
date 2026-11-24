# Frontend: revisión y relevo a Gemini

## Alcance y estado

Base descargada: `efc7fb0` de `Cristianv222/app-uvillas`, rama remota por defecto.
Codex implementa primero; Gemini debe continuar después, sin escritores simultáneos.
No se ha ejecutado Gemini: no está disponible como CLI ni como integración conectada.
Esta entrega agrega una landing web independiente. No implementa una segunda app de
reconocimiento en navegador ni modifica la lógica del móvil/backend.

## Arquitectura revisada

- `backend/`: Django + DRF + Channels, monolito modular; PostgreSQL y Redis en Compose.
- `mobile/`: Expo/React Native; persistencia SQLite, inferencia TFLite local y sincronización.
- `ml-models/`: fuente compartida de modelos y catálogo; el móvil los copia al instalar.
- `frontend/`: React/TypeScript/Vite, despliegue estático nginx; sin llamadas a API.
- `frontend/src/components/Botanical.tsx`: ilustraciones SVG originales de las cuatro etapas.
- `frontend/src/components/Arc.tsx`: integración ThreeUI con carga diferida.
- `frontend/src/main.tsx`: secciones, navegación por scroll y selector de partes.
- `frontend/src/style.css`: diseño adaptable y movimiento reducido.

### Hallazgos para el equipo

1. `docs/ARCHITECTURE.md` afirma que application no depende de Django; sin embargo,
   `farms/application/use_cases.py` y `scans/application/use_cases.py` importan ORM
   y `django.utils.timezone`; `sync/application/use_cases.py` también importa Django.
   La separación es parcial. Documentar la excepción o introducir puertos en otra tarea.
2. `backend/requirements.txt` deja casi todas las dependencias sin versión fija.
   La compilación no es completamente reproducible. El frontend sí incluye lockfile.
3. `backend/docker/entrypoint.sh` reintenta cualquier fallo de migración indefinidamente.
   Un error de esquema puede confundirse con indisponibilidad de PostgreSQL.
4. El README ya reconoce que el catálogo requiere validación agronómica y que el móvil
   no se ha probado en dispositivo. No convertir esos pendientes en promesas de producción.
5. La landing presenta funcionalidades del proyecto; la maqueta de teléfono está marcada
   como ilustrativa. No hay descarga publicada, formulario falso ni diagnóstico simulado.

## ThreeUI

Paquete instalado: `@designcodeio/threeui` 1.2.0. Se importa su CSS oficial.
Se usa la entrada pública por componente para evitar evaluar componentes no utilizados.
El MCP solicitado respondió `{"error":"authentication_required"}` al inicializarlo.
Su autenticación Pro debe configurarse en el cliente MCP, nunca en variables públicas de Vite.
El recorrido botánico es propio; no se presenta como una plantilla descargada del MCP.

## Continuación secuencial

1. Leer este archivo, README y `git diff` antes de editar; preservar el trabajo existente.
2. Limitar cambios a `frontend/` y a documentación/Compose de la web.
3. Validar primero el diseño a 390, 768 y 1440 px; comprobar que textos y plantas no se
   superpongan, que no exista scroll horizontal y que se vea cada etapa al desplazarse.
4. Probar anclas, menú móvil, pestañas con teclado (flechas, Inicio y Fin), foco visible,
   preferencia de movimiento reducido y comportamiento sin WebGL.
5. Mantener las animaciones decorativas aisladas: un fallo del efecto no debe ocultar contenido.
6. Ejecutar `npm ci && npm run build` dentro de `frontend/`, luego
   `docker compose up -d --build frontend` y comprobar `http://localhost:8080`.
7. Entregar un diff y resultados concretos de validación para revisión posterior por Codex.

## Límites de validación

La compilación local TypeScript/Vite pasa. La inspección visual automatizada no pudo
realizarse: no hay navegador conectado y el control nativo no tiene permisos.
Las fuentes de Google tienen alternativas locales; la web no necesita backend para navegar.
El paquete ThreeUI genera chunks de variantes opcionales de más de 500 kB; la variante
usada se carga en un chunk separado. No se ocultó el aviso de tamaño.

## Comprobación Docker

Se compilaron las imágenes backend y frontend. PostgreSQL, Redis, Django y nginx
arrancaron correctamente. `/api/health/` devolvió `{"status": "ok"}` y la landing
respondió HTTP 200 en el puerto 8080. No se modificó código del backend.

Las 21 pruebas existentes del backend pasaron en Docker con SQLite y los modelos
TFLite reales (`Ran 21 tests`, `OK`). No se compiló el móvil nativo.


## Fase 2: Implementación y Validación por Gemini (Antigravity)

### Mejoras incorporadas
1. **Recorrido botánico completo por scroll**:
   - Transiciones fluidas entre las etapas de la uvilla: Hoja (`stage 0`), Flor (`stage 1`), Cáliz/Capacho (`stage 2`) y Fruto maduro (`stage 3`), con ilustración de tallos vasculares en `stage 4`.
   - Navegación inferior sincronizada bidireccionalmente por anclas e `IntersectionObserver`.

2. **Diagnóstico y fitosanidad conectada al catálogo (`#cultivo`)**:
   - Integración de las 19 condiciones reales de `ml-models/catalog.json` categorizadas por parte (Hojas, Tallos, Frutos).
   - Fichas y chips interactivos con códigos de severidad (*low*, *medium*, *high*), síntomas botánicos clave y recomendaciones agronómicas.

3. **Simulador de app móvil interactivo (`#app`)**:
   - Maqueta interactiva que emula la experiencia móvil: selector de partes foliares/tallos/frutos, simulación de captura fotográfica con barrido de retícula neuronal, lectura de confianza (%) y metadatos de persistencia local (SQLite y GPS).

4. **Integración ThreeUI (`@designcodeio/threeui`)**:
   - Efecto `PredictiveArcCanvas` con carga diferida (`React.lazy` + `Suspense`), resguardado ante errores WebGL mediante `EffectBoundary` y desactivado automáticamente cuando el sistema solicita reducción de movimiento (`prefers-reduced-motion`).

5. **Responsividad y UX**:
   - Prevención de desbordamiento horizontal (`overflow-x: hidden`).
   - Soporte verificado para pantallas móviles (390 px), tabletas (768 px) y monitores amplios (1440 px+).
   - Accesibilidad teclado completa: ARIA tabs, navegación por flechas, `Home` y `End`, enlace de salto directo `#recorrido`.

### Estado de compilación y servicios Docker
- `frontend`: compila con Vite / TypeScript (`tsc -b && vite build`) y se sirve con Nginx 1.28 en `http://localhost:8080` (HTTP 200).
- `backend`: servicio Django 5 + Daphne activo en `http://localhost:8000` (`/api/health/` responde `{"status": "ok"}`).
- `db`: PostgreSQL 16 Alpine en estado *healthy*.
- `redis`: Redis 7 Alpine activo.
- `tests`: 21/21 pruebas unitarias del backend pasando exitosamente con modelos TFLite reales.

## Actualización: ciclo del fruto

Se integró origin/main hasta 09f4e88 mediante fast-forward preservando cambios locales.
El backend incorpora exportaciones CSV/XLSX, permisos y registro web; esta landing
sigue siendo pública y no ejecuta esos flujos hasta que se acuerde su integración.
Lifecycle.tsx sustituye el recorrido anterior con progreso continuo por scroll:
fruto partido, semillas, brote y ramificación. Es ilustración SVG, no render 3D.
Build TypeScript/Vite validado; revisión visual pendiente. Las 21 pruebas citadas
arriba corresponden a la versión anterior del backend, no a esta actualización.

## Laboratorio conectado y dirección visual

La landing incorpora portada fotográfica, verde bosque/ámbar y acceso directo a
`#laboratorio`. Se retiró el simulador con confianza y GPS fijos. Laboratory.tsx
utiliza registro/login, clasificación multipart, guardado e historial reales.
api.ts mantiene JWT en memoria, renueva el access y revoca el refresh al salir.
El proxy /api de nginx y Vite evita configurar CORS para la web local.
La foto se usa para inferencia; solo se guarda el resultado, indicado en pantalla.
No hay persistencia de sesión al recargar. Fotografías y licencias en public/photos.
El catálogo educativo de la landing sigue siendo estático; no representa datos
obtenidos del API. No se implementó administración ni gestión de fincas en la web.

## Separación de módulos

Rutas `/` (LandingPage) y `/laboratorio` (LaboratoryPage), con carga diferida.
El enlace antiguo /#laboratorio redirige a la nueva ruta. Rutas desconocidas muestran
una pantalla de recuperación. Nginx mantiene el fallback de SPA para recargas.
El ciclo SVG es autónomo (sin imágenes remotas); incluye suelo, raíces y cosecha.
Se usa overflow-x:clip para no crear un contenedor de scroll que rompa sticky.
La paleta compartida define uvilla, hoja, suelo y fondo. Referencias del usuario
no copiadas. Las fotografías locales mantienen sus créditos originales.

## GSAP, ThreeUI y login

Se eliminó la sección estática de condiciones del cultivo solicitada por el usuario.
Login con fotografía coincidente con la referencia (fuente en CREDITS.txt), sin
indicador de servidor. Lifecycle usa GSAP ScrollTrigger con scrub, limpieza al
desmontar y matchMedia para movimiento reducido. MotionSurface comparte ThreeUI
PredictiveArcCanvas, con carga diferida y límite de errores, entre ambas rutas.
La ilustración del ciclo sigue siendo SVG procedural con textura y nervaduras;
no es una simulación 3D fotorealista.

## Laboratorio sin cuenta

Se retiran login/registro del frontend. POST /api/recognition/laboratory/ permite
clasificación anónima con el mismo caso de uso y límite de imagen, 20 solicitudes
por hora/IP. No abre /scans ni classify privado. Resultados de sesión en memoria,
sin cuenta, sin guardado permanente. El cambio backend es acotado a esta necesidad.
Foto solicitada movida a portada y frutos. Paleta naranja/verde unificada, ciclo
con navegación por etapas y ajustes específicos para 400/800 px. La ilustración
sigue siendo SVG, sin afirmar realismo 3D. Prueba visual en navegador pendiente.

## Fase 3: Integración de fotos reales del usuario y paleta uvilla

1. **Fotografías reales del usuario integradas en `/frontend/public/photos/`:**
   - `caliz-planta.jpg`: Cáliz maduro / capacho seco colgando de ramas con hojas verdes al fondo (foto real 1024x576).
   - `frutos-naranja.jpg`: Frutos de uvilla color naranja vivo, mostrando corte transversal con pulpa y semillas (foto real 578x600).
   - `frutos-cosecha.jpg`: Frutos y cálices en cosecha seleccionada (foto real 960x640).
2. **Paleta botánica uvilla refinada:**
   - `--uvilla`: `#e8882a` (naranja brillante extraído directamente de la pulpa real).
   - `--uvilla-light`: `#fddcaa` / `--uvilla-dark`: `#b85d14`.
   - `--leaf`: `#163d2b` (verde follaje profundo andino) / `--leaf-mid`: `#245839`.
   - `--soil-light`: `#d4a850` (dorado pajizo del capacho seco protector).
   - `--paper`: `#fffbf2` (fondo cálido orgánico).
3. **Hero Gallery & Vitrina botánica:**
   - Galería asimétrica en el Hero con tarjeta principal de cáliz seco e insignias botánicas dinámicas (`.hero-card--main`, `.hero-card--side-top`, `.hero-card--side-bottom`).
   - Vitrina de 3 fotos reales (`.fruit-vitrine`) con fichas descriptivas del cáliz, fruto/pulpa y estructura de hojas/tallos, junto a tabla de composición nutricional andina.
4. **Diseño completamente responsivo:**
   - Desktop (1440px+): Hero gallery a 2 columnas con curvatura orgánica, vitrina de 4 columnas.
   - Tablet (768px - 1024px): Reorganización fluida a 2 columnas sin desbordamiento.
   - Móvil (390px - 768px): Columna única, menú hamburguesa accesible, tarjetas adaptadas a proporciones 4:3 / 16:9 con altura contenida y navegación táctil óptima.
5. **Verificación Docker y build:**
   - `npm run build` en `frontend/` ejecutado sin advertencias bloqueantes ni errores de TypeScript.
   - Contenedor `app-uvillas-frontend-1` recreado y levantado en puerto 8080.
   - Verificados endpoints `/`, `/laboratorio` y los 3 archivos fotográficos con código HTTP `200 OK`.
