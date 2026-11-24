# App Uvillas

App móvil que diagnostica enfermedades de la uvilla con la cámara sobre **hojas**, **tallos** y **frutos** (un modelo por parte). Funciona **sin internet** (los modelos viajan dentro del teléfono) y **con internet** (reconocimiento por WebSocket en el servidor, sincronización y reportes).

**Contenido:** [Stack](#stack) · [Modelos](#los-3-modelos-ml-models) · [Arquitectura](#arquitectura) · [Estructura y archivos](#estructura-de-carpetas-y-archivos) · [Lógica del backend](#lógica-del-backend) · [Lógica del móvil](#lógica-del-móvil) · [API](#api) · [Pruebas](#pruebas) · [Puesta en marcha](#puesta-en-marcha) · [Límites conocidos](#límites-conocidos)

## Stack

| Capa | Tecnología |
|---|---|
| Móvil | React Native + Expo (dev build), TypeScript, NativeWind (Tailwind) y `lucide-react-native` (solo iconos, sin kit de componentes) |
| Inferencia en el teléfono | `react-native-fast-tflite` (modelos `.tflite` empaquetados como assets) |
| BD offline | SQLite (`expo-sqlite`) con migraciones por `PRAGMA user_version` |
| Backend | Django 5 + Django REST Framework + Channels (Daphne, WebSocket) |
| Inferencia en el servidor | `ai-edge-litert` (los mismos `.tflite`) + Pillow + NumPy |
| Auth | JWT (SimpleJWT): access 15 min, refresh 30 días con rotación y lista negra |
| BD servidor | PostgreSQL 16 + Redis (capa de canales del WebSocket) |
| Contenedores | Docker Compose: `db`, `redis`, `backend` |

## Los 3 modelos (`ml-models/`)

Clasificadores de imagen TFLite exportados de Teachable Machine (entrada 224×224 RGB, `float32` normalizado a [-1, 1]). **Fuente única de verdad**: Docker la monta en el backend (solo lectura) y el móvil la copia con `npm run sync-models`.

| Carpeta | Clases |
|---|---|
| `hojas/` | 8: Pudrición Dura, Muerte Descendente, Moho Blanco, Marchitez Bacterial, Mancha Gris, Mancha Grasienta, Hoja Sana, Esclerotiniosis |
| `tallos/` | 4: Sano, Dura, Blanco, Esclerotiniosis |
| `frutos/` | 7: Pudrición Dura, Muerte Descendente, Moho Blanco, Mancha Gris, Mancha Grasienta, Fruto Sano, Esclerotiniosis (la etiqueta del modelo dice `Escleroteniosis`) |

Cada carpeta tiene `model_unquant.tflite` y `labels.txt`. Además:

- `ml-models/catalog.json`: ficha de las 19 enfermedades (descripción, síntomas, qué hacer, gravedad). Lo carga el backend (`seed_catalog`) y viaja dentro de la app, así el catálogo funciona offline. **Los textos son de referencia y deben validarse con un ingeniero agrónomo.** En tallos se asumió `Dura` = pudrición dura y `Blanco` = moho blanco.
- Un modelo **no** dice "qué parte es": el usuario elige hoja, tallo o fruto y se usa el modelo de esa parte.
- Son clasificadores: dicen "qué enfermedad es", no dibujan cajas ni cuentan frutos.

## Arquitectura

Monolito modular con Clean Architecture aplicada sin extremos. Regla de dependencias: `interfaces → application → domain`; `infrastructure` implementa los puertos. **`domain` no importa Django.**

| Capa | Qué contiene | Qué NO contiene |
|---|---|---|
| `domain/` | Entidades, reglas de negocio, puertos (interfaces) | Django, DRF, SQL |
| `application/` | Casos de uso que orquestan el dominio | HTTP |
| `infrastructure/` | Modelos ORM, repositorios, TFLite, JWT | Reglas de negocio |
| `interfaces/` | Vistas DRF, serializers, consumers WebSocket, URLs | Lógica de negocio |

Matices honestos: los CRUD simples (fincas, lotes, diagnósticos) usan `ModelViewSet` de DRF y delegan las reglas a casos de uso; `sync` y `reports` conocen los modelos de `farms` y `scans` (acoplamiento aceptado dentro del monolito). En el móvil, las pantallas leen SQLite a través de `db/repositories` (compartidos entre features) en vez de un repositorio por feature. Ver también [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Estructura de carpetas y archivos

### Raíz

| Archivo | Para qué sirve |
|---|---|
| `docker-compose.yml` | Levanta `db` (Postgres 16 con healthcheck), `redis` y `backend` (puerto 8000; monta `ml-models/` en solo lectura y un volumen para `media/`) |
| `.env.example` | Variables del backend (clave Django, Postgres, Redis, duración de JWT). Se copia a `.env` (ignorado por git) |
| `.gitignore` | Ignora `.env`, bases SQLite, `media/`, `node_modules`, etc. |
| `docs/ARCHITECTURE.md` | Decisiones de arquitectura |
| `ml-models/` | Modelos, etiquetas y `catalog.json` (ver arriba) |

### `backend/` (Django)

| Ruta | Qué hace |
|---|---|
| `manage.py`, `requirements.txt`, `Dockerfile` | Entrada de Django; dependencias; imagen `python:3.12-slim` |
| `docker/entrypoint.sh` | Al arrancar: reintenta `migrate` hasta que Postgres responda, ejecuta `seed_catalog` y lanza Daphne |
| `config/settings/base.py` | Configuración por variables de entorno: Postgres (o SQLite con `DB_ENGINE=sqlite`), Redis para Channels (o memoria si no hay `REDIS_URL`), JWT, CORS, zona horaria `America/Bogota`, ruta de modelos `ML_MODELS_DIR`, usuario propio `accounts.User` |
| `config/urls.py` | Monta las rutas `/api/...` de cada módulo, `/api/health/` y `/admin/` |
| `config/asgi.py` | HTTP normal + WebSocket (`ws/recognition/`) |

**`shared/`** (código transversal)

| Archivo | Qué hace |
|---|---|
| `domain/errors.py` | `DomainError` y derivados (`ValidationError` 400, `NotFoundError` 404, `PermissionDeniedError` 403, `ConflictError` 409) con `code` legible por el cliente |
| `domain/parts.py` | Enum `Part` (`hojas`, `tallos`, `frutos`) y `Part.parse()` que valida |
| `domain/labels.py` | Lee los `labels.txt` de Teachable Machine: quita prefijos (`F.`, `T.`, `H_`), genera `code` sin tildes (`pudricion_dura`) y marca `is_healthy` si termina en `sano`/`sana` |
| `infrastructure/models.py` | `SyncableModel` abstracto: `id` UUID (lo puede crear el móvil), `created_at`, `updated_at`, `is_deleted` (borrado lógico) |
| `interfaces/exception_handler.py` | Convierte cualquier `DomainError` en respuesta `{code, detail}` con su HTTP |

**`modules/`**: cada módulo tiene `domain/ application/ infrastructure/ interfaces/ tests/`.

| Módulo | Qué guarda y hace | Archivos clave |
|---|---|---|
| `accounts` | Usuarios con login por correo, roles `farmer`/`admin` | `domain/entities.py` (`NewUser` valida correo y contraseña ≥ 8) · `application/use_cases.py` (`RegisterUser`: rechaza correos repetidos) · `infrastructure/models.py` (`User`) · `infrastructure/repositories.py` · `infrastructure/jwt/tokens.py` (emitir tokens y validar un access, usado por el WebSocket) · `interfaces/views.py` (register, login, me, logout) |
| `catalog` | Fichas de enfermedades por parte | `infrastructure/models.py` (`Disease`, único por parte+código) · `application/use_cases.py` (`ListDiseases`, `GetDisease`, `SeedCatalog`) · `management/commands/seed_catalog.py` (carga `catalog.json`; idempotente) |
| `farms` | Fincas y lotes de cada usuario | `infrastructure/models.py` (`Farm`, `Plot`) · `domain/entities.py` (nombre obligatorio, área ≥ 0) · `application/use_cases.py` (`CreateFarm`, `CreatePlot` verifica que la finca sea del usuario, `DeleteFarm` borra también sus lotes, lógicamente) |
| `scans` | Diagnósticos guardados | `domain/entities.py` (`ScanDraft`: parte válida, confianza 0–1, origen `local`/`server`, lat/lon en rango, `is_healthy` derivado) · `application/use_cases.py` (`CreateScan` verifica que finca/lote sean del usuario; `DeleteScan` lógico) · `infrastructure/models.py` (`Scan` con foto, top-3, GPS) · `interfaces/views.py` (CRUD, filtros, `POST /{id}/image/`) |
| `recognition` | Inferencia en el servidor | `domain/entities.py`, `domain/ports.py` (puerto `ImageClassifier`) · `application/use_cases.py` (`ClassifyImage`: valida parte, imagen no vacía ni > 5 MB) · `infrastructure/tflite/classifier.py` · `interfaces/api/views.py` (HTTP) · `interfaces/websocket/{auth,consumer,routing}.py` |
| `sync` | Sincronización offline | `domain/conflict.py` (`resolve`) · `domain/ports.py` · `application/use_cases.py` (`PushChanges`, `PullChanges`) · `infrastructure/repositories.py` (ORM) · `interfaces/views.py` |
| `reports` | Estadísticas | `domain/metrics.py` (`health_ratio`) · `application/use_cases.py` (`GetSummary`) · `infrastructure/queries.py` (agregaciones ORM) · `interfaces/views.py` |

Cada módulo trae además `apps.py` (registro en Django), `models.py` (reexporta los modelos de `infrastructure/`; `recognition`, `sync` y `reports` no tienen modelos) y `migrations/` (`accounts`, `catalog`, `farms`, `scans`).

### `mobile/` (React Native / Expo)

| Ruta | Qué hace |
|---|---|
| `App.tsx`, `index.ts` | Raíz: `SafeAreaProvider → NetworkProvider → AuthProvider → SyncProvider → RootNavigator` |
| `app.json` | Nombre, ids (`com.uvillas.app`), permisos de cámara y ubicación, plugins (camera, location, sqlite, secure-store, fast-tflite) |
| `babel.config.js`, `metro.config.js`, `tailwind.config.js`, `global.css`, `nativewind-env.d.ts` | NativeWind/Tailwind; Metro acepta `.tflite` como asset; paleta (`brand` verde, `gold`, `ink`, `danger`) |
| `scripts/sync-models.mjs` | Copia los `.tflite` y `catalog.json` desde `../ml-models`, y **genera** `src/ml/models/labels.generated.ts` con las etiquetas. Corre solo tras `npm install` (`postinstall`) |
| `.env.example` | `EXPO_PUBLIC_API_URL` (según emulador, simulador o teléfono real) |

**`src/`**

| Carpeta | Archivos y responsabilidad |
|---|---|
| `navigation/` | `RootNavigator.tsx`: pantalla de carga → pila de login/registro (sin sesión) o pestañas **solo con iconos** (Cámara, Historial, Enfermedades, Reportes, Ajustes) + pantallas de detalle |
| `core/config/` | `env.ts`: URL del API/WS, intervalo del bucle en vivo (120 ms), fotogramas promediados (4), sincronización periódica (5 min) |
| `core/http/` | `client.ts`: `api()` con `Authorization`, renovación de token en un solo vuelo (`refreshing`) y reintento tras 401; `getValidAccessToken()` renueva si faltan < 30 s; `uploadFile()` multipart para fotos |
| `core/auth/` | `AuthContext.tsx`: estado `loading/signedOut/signedIn`, login, registro, logout |
| `core/storage/` | `secureStore.ts` (tokens y perfil en `expo-secure-store`) · `settingsStore.ts` (modo de inferencia local/servidor, persistido en SQLite) |
| `core/network/` | `NetworkProvider.tsx`: `useIsOnline()` con NetInfo |
| `core/websocket/` | `RecognitionSocket.ts`: cliente del WS con reconexión exponencial (1 s → 15 s) y un solo fotograma en vuelo |
| `core/errors/` | `ApiError`, `NetworkError`, `errorMessage()` |
| `db/` | `database.ts` (abre SQLite y aplica migraciones) · `migrations/index.ts` (tablas `meta`, `farms`, `plots`, `scans`) · `repositories/` `farmsRepo`, `scansRepo` (incluye `summary()` para reportes), `syncRepo`, `metaRepo` |
| `ml/` | `types.ts` (`Part`, `Prediction`) · `models/index.ts` (`require` estático de los 3 `.tflite`) · `inference/localClassifier.ts` (carga, `classifyLocal`, `averagePredictions`) · `preprocessing/capture.ts` (foto → recorte cuadrado → 224×224 JPEG) · `preprocessing/jpeg.ts` (JPEG → tensor float32 en [-1,1]) |
| `ui/` | `components/`: `Screen`, `Button`, `IconButton`, `Card`, `Input` (etiqueta siempre visible), `Chip`, `Badge`, `ProgressBar`, `EmptyState`, `SectionTitle` · `icons/index.ts`: iconos de Lucide que usa la app |
| `shared/utils/` | `format.ts`: porcentaje, fecha, `sleep` |
| `features/auth/` | `LoginScreen`, `RegisterScreen` (validación al enviar, aviso si no hay internet) |
| `features/scan/` | `ScanScreen` (cámara, selector de parte, resultado, finca/lote, guardar) · `application/useLiveRecognition.ts` (bucle de reconocimiento) · `application/saveScan.ts` (guarda foto + registro) |
| `features/history/` | `HistoryScreen` (lista con filtro por parte e indicador de pendiente de sync) · `ScanDetailScreen` (foto, top-3, GPS, enlace a "qué hacer", eliminar) |
| `features/catalog/` | `CatalogScreen`, `DiseaseDetailScreen` · `data/catalogRepository.ts` (lee `catalog.json` empaquetado) · `domain/types.ts` |
| `features/farms/` | `FarmsScreen`: crear/eliminar fincas y lotes |
| `features/reports/` | `ReportsScreen`: totales, % sanos, por parte, enfermedades frecuentes, últimos días; se calcula en el teléfono |
| `features/settings/` | `SettingsScreen`: cuenta, modo de reconocimiento, estado y botón de sincronización, cerrar sesión |
| `features/sync/` | `application/syncService.ts` (push → pull → subir fotos) · `presentation/SyncProvider.tsx` (cuándo sincronizar) |

Las carpetas `domain/`, `application/`, `data/` y `components/` de features que aún no tienen archivos son la estructura reservada para crecer; git no las guarda hasta que tengan contenido.

## Lógica del backend

### Autenticación (JWT)
1. `POST /api/auth/register/`: `RegisterUser` valida correo y contraseña (≥ 8), rechaza duplicados y crea el usuario (`username = correo`). Responde usuario + tokens.
2. `POST /api/auth/login/`: devuelve `access` (15 min), `refresh` (30 días) y `user`.
3. `POST /api/auth/refresh/`: **rota** el refresh y manda el anterior a la lista negra.
4. `POST /api/auth/logout/`: pone el refresh en la lista negra.
5. Todo lo demás exige `Authorization: Bearer <access>`; cada usuario solo ve sus datos.

### Reconocimiento
- **Preprocesado** (`classifier.py`): corrige rotación EXIF, recorte central cuadrado, redimensiona a 224×224 y normaliza `x/127.5 − 1`. Es lo que hace Teachable Machine, por eso el resultado coincide con el del teléfono.
- **Carga**: cada modelo se carga una vez (`lru_cache`) y se protege con un `lock` por intérprete. Si las salidas no suman 1 aplica softmax.
- **HTTP**: `POST /api/recognition/classify/` (multipart `part` + `image`) → mejor clase y top-3.
- **WebSocket** `ws/recognition/?token=<access>&part=hojas`:
  - Sin token válido se cierra con código `4401`; parte inválida, `4400`.
  - Cliente → servidor: bytes JPEG, o JSON `{"image": "<base64>", "part": "...", "id": "..."}`; un JSON solo con `part` cambia de parte.
  - Servidor → cliente: `{"type":"ready"}`, `{"type":"result","id","part","best","predictions"}` o `{"type":"error","code","detail"}`.
  - La inferencia corre en un hilo para no bloquear el bucle de eventos.

### Diagnósticos, fincas y lotes
- El móvil puede mandar su propio `id` (UUID): así un diagnóstico creado offline conserva su identidad.
- `is_healthy` **lo calcula el servidor** a partir del código de la clase; no se confía en lo que envíe el cliente.
- Eliminar = borrado lógico (`is_deleted`, `updated_at` nuevo) para que se propague. Borrar una finca borra sus lotes.

### Sincronización
- **Push** `POST /api/sync/push/` con `{farms, plots, scans}`; cada registro lleva `id` y `updated_at`. Se procesa en ese orden por las llaves foráneas.
- **Conflicto** (`domain/conflict.py`): gana el `updated_at` más reciente; en empate gana el servidor.
- Respuesta: `applied` (aplicados), `conflicts` (ganó el servidor) y `rejected` (con `code`, p. ej. `foreign_record`, `invalid_part`, `farm_not_found`). Un registro malo no frena a los demás.
- Un registro de **otro usuario** nunca se modifica (`foreign_record`).
- **Pull** `GET /api/sync/pull/?since=<ISO>`: todo lo cambiado después de `since` (incluye borrados); sin `since` devuelve todo. La respuesta trae `server_time`.
- Las fotos se suben aparte (`POST /api/scans/{id}/image/`).

### Reportes
`GET /api/reports/summary/` (filtros `farm`, `plot`, `date_from`, `date_to`): total, sanos, enfermos, `health_ratio`, conteo por parte, enfermedades más frecuentes (por parte + enfermedad) y línea de tiempo por día.

## Lógica del móvil

### Arranque y sesión
1. Se abre/migra SQLite y se cargan los ajustes.
2. Si hay tokens y perfil guardados en el almacén seguro → entra directo (**funciona sin internet**) y, si hay red, refresca `/me` en segundo plano.
3. Si el refresh vence o se revoca → se limpia la sesión y vuelve al login.
4. La primera vez sí hace falta internet para iniciar sesión.

### Reconocimiento en vivo (`useLiveRecognition`)
Cada ciclo: foto reducida → recorte cuadrado 224×224 → modelo → promedio de los últimos 4 fotogramas (evita que el resultado parpadee).
- **Modo "teléfono"** (por defecto): JPEG → tensor → TFLite local.
- **Modo "servidor"** + internet + socket abierto: envía el JPEG en base64 por WebSocket; los resultados llegan de forma asíncrona.
- Si se pierde internet o el socket se cae, **cambia solo al modelo local**. La etiqueta de la pantalla indica "Servidor", "En el teléfono" o "Sin conexión".
- Cambiar de parte reinicia el promedio y precarga el modelo. La cámara se libera al salir de la pestaña.

### Guardar un diagnóstico (`saveScan`)
Toma una foto de calidad, la copia a `documentDirectory/scans/<uuid>.jpg`, pide ubicación (opcional; si se niega, se guarda sin GPS) e inserta en SQLite con `dirty = 1`. Luego avisa a la sincronización.

### Base de datos local
Tablas `farms`, `plots`, `scans` (todas con `user_id`, `updated_at`, `is_deleted`, `dirty`; `scans` además `image_uri` e `image_synced`) y `meta` (clave/valor: ajustes y `last_pull:<usuario>`). Las consultas filtran por usuario. Las migraciones son una lista ordenada: **nunca se edita una publicada, se agrega otra**.

### Sincronización (`syncNow`)
1. **Push**: envía lo `dirty`. Lo aplicado y lo que perdió un conflicto se marca limpio (solo si no cambió mientras viajaba).
2. **Pull**: pide lo nuevo desde `last_pull`; un registro del servidor no pisa a uno local pendiente y más reciente.
3. **Fotos**: sube las `image_synced = 0` (si el servidor ya no tiene ese diagnóstico, deja de reintentar).
4. Se dispara al iniciar sesión, al recuperar internet, al volver a la app, cada 5 minutos y 1,5 s después de un cambio local. Nunca corren dos a la vez. Los pendientes se ven en Ajustes.

### Pantallas
Cámara · Historial (y detalle) · Enfermedades (y detalle, con descargo de "confirma con un técnico") · Reportes (calculados en el teléfono, sin internet) · Ajustes (modo de reconocimiento, sincronización, fincas y lotes, cerrar sesión).

## API

| Método y ruta | Descripción |
|---|---|
| `POST /api/auth/register/` · `login/` · `refresh/` · `logout/` · `GET me/` | Autenticación JWT |
| `GET /api/catalog/diseases/?part=` · `/{part}/{code}/` | Catálogo |
| `/api/farms/` · `/api/farms/plots/?farm=` | Fincas y lotes (CRUD) |
| `/api/scans/?part=&farm=&plot=&is_healthy=` · `POST /{id}/image/` | Diagnósticos |
| `POST /api/recognition/classify/` | Clasificar una imagen |
| `WS /ws/recognition/?token=<access>&part=hojas` | Tiempo real |
| `POST /api/sync/push/` · `GET /api/sync/pull/?since=` | Sincronización offline |
| `GET /api/reports/summary/` | Reportes |
| `GET /api/reports/export/` | CSV de diagnósticos con JWT, una fila por registro activo. Admite `date_from`, `date_to`, `farm` y `plot`. El administrador puede exportar todos los usuarios o filtrar por `user` (UUID). |
| `GET /api/reports/export/csv/` · `GET /api/reports/export/xlsx/` | Descarga el resumen del usuario con JWT. Ambos formatos admiten los filtros `farm`, `plot`, `date_from` y `date_to` e incluyen totales, desglose por parte, enfermedades y evolución diaria. |
| `GET /api/health/` | Estado del servidor |

## Pruebas

La suite del backend incluye pruebas unitarias, de API y de inferencia con los modelos TFLite reales.

| Archivo | Qué cubren |
|---|---|
| `shared/tests/test_labels.py` | Parseo de etiquetas con los tres estilos de prefijo |
| `accounts/tests/test_auth.py` | Validación de correo/contraseña, correo duplicado, registro → login → `/me` → refresh rotativo → logout, ruta protegida, login incorrecto |
| `scans/tests/test_scans.py` | Validación de `ScanDraft`, flujo finca → lote → diagnóstico con UUID del cliente → listar/filtrar/eliminar, y catálogo sembrado (19 fichas) |
| `recognition/tests/test_recognition.py` | Los 3 modelos existen con 8/4/7 clases; cada uno devuelve probabilidades que suman 1; entradas inválidas; endpoint HTTP; WebSocket rechaza sin token y hace ida y vuelta con un fotograma |
| `sync/tests/test_sync.py` | Regla de conflicto, push/pull, el más viejo pierde y el más nuevo gana, pull incremental, borrados, no tocar datos de otro usuario, registros inválidos |
| `farms/tests/test_farms.py` | Validación de nombres y áreas, propiedad de fincas, creación de lotes y borrado lógico en cascada |
| `catalog/tests/test_catalog.py` | Listado, filtros, detalle, validación e importación repetida del catálogo |
| `reports/tests/test_exports.py` | Descarga CSV y XLSX, filtros, aislamiento por usuario, reporte vacío y tipos de celda |
| `reports/tests/test_reports.py` | Métrica, resumen y filtro de fecha inválido |

El móvil se verificó con `npm run typecheck` y empaquetando con Metro (`expo export`); **no tiene pruebas automáticas ni se ha ejecutado aún en un teléfono o simulador**.

## Puesta en marcha

**Backend**

```bash
cp .env.example .env          # cambia DJANGO_SECRET_KEY y POSTGRES_PASSWORD
docker compose up --build     # http://localhost:8000/api/health/
```

Pruebas (SQLite + modelos reales):

```bash
docker compose run --rm --no-deps -e DB_ENGINE=sqlite -e REDIS_URL= --entrypoint python backend manage.py test
```

**Móvil** (requiere *dev build*: la cámara y TFLite son código nativo, no funciona en Expo Go)

```bash
cd mobile
cp .env.example .env          # EXPO_PUBLIC_API_URL: 10.0.2.2 (emulador Android), localhost (simulador iOS) o la IP de tu PC
npm install                   # copia modelos y catálogo automáticamente
npx expo run:android          # o: npx expo run:ios
npm run typecheck
```

Si cambias un modelo o `catalog.json` en `ml-models/`: ejecuta `npm run sync-models` en `mobile/` y reinicia el backend.

## Límites conocidos

- **Tiempo real aproximado**: ~2–4 diagnósticos por segundo (foto → modelo). Para más velocidad habría que pasar a *frame processors* de VisionCamera.
- **Login offline**: solo si ya se inició sesión antes en ese teléfono; no se puede validar una contraseña sin servidor.
- **Fotos del servidor**: las fotos subidas no se descargan a otros dispositivos (el `pull` solo indica `has_image`).
- **Producción**: falta proxy HTTPS (nginx/Caddy), `DJANGO_DEBUG=0`, `DJANGO_ALLOWED_HOSTS` y CORS definidos, y compilar la app firmada.
- **Catálogo**: contenido genérico, pendiente de validación agronómica.

## Frontend web: landing botánica

La landing vive en `frontend/` (React + TypeScript + Vite). Es independiente de
`mobile/` y del backend: no necesita autenticación, base de datos ni modelos ML.
Su recorrido por scroll presenta hoja, flor, cáliz y fruto con ilustraciones SVG,
además de cuidado del cultivo y presentación de la app. El fondo animado utiliza
`PredictiveArcCanvas` de `@designcodeio/threeui`.

```bash
# Solo la landing, sin arrancar servicios del backend:
docker compose up -d --build frontend
# Abrir http://localhost:8080

# Desarrollo con recarga:
cd frontend
npm ci
npm run dev
# Validar TypeScript y generar dist/:
npm run build
```

Para levantar todo: `docker compose up -d --build` (requiere el `.env` descrito
arriba). Docker compila la web con Node y sirve los archivos con nginx.
El móvil sigue requiriendo una compilación nativa; Docker no genera una app iOS/Android.

El MCP `https://threeui.com/api/mcp` requiere autenticación; instalar el paquete npm
no habilita el MCP. No incluir credenciales del MCP en el código del navegador.

Ver [revisión y relevo del frontend](docs/FRONTEND_HANDOFF.md).

### Laboratorio web conectado

`http://localhost:8080/#laboratorio` permite crear cuenta o iniciar sesión,
analizar JPEG/PNG de hasta 5 MB con `/api/recognition/classify/`, guardar resultados
con `/api/scans/` y consultar el historial real. Las fotos seleccionadas se envían
al clasificador, pero no se adjuntan al registro guardado. La sesión JWT permanece
en memoria y se renueva mientras la página está abierta; recargar requiere login.
Nginx y Vite redirigen `/api/` al backend. El análisis web necesita servidor disponible.
Créditos de fotografías: `frontend/public/photos/CREDITS.txt`.

### Sistema experto en el laboratorio web

El modelo de imágenes acierta bien si el órgano está sano (80–95 %), pero no distingue
las enfermedades entre sí (14–31 %). Por eso el laboratorio reparte funciones:

1. **Reglas de control** (`frontend/src/expert/engine.ts`, `assessImage`): R1 pide otra foto
   si la confianza es menor de 50 %; R2 acepta el órgano sano si su clase supera 60 %;
   R3 pasa a preguntas si el modelo ve una enfermedad.
2. **Reglas por síntomas y clima** (`frontend/src/expert/knowledgeBase.ts`): preguntas
   Sí/No/No sé según el órgano, y temperatura y humedad opcionales.
3. **Factores de certeza** (`diagnose`): la confianza del modelo, ponderada por su fiabilidad
   en cada órgano, se combina con las reglas con FC = FC₁ + FC₂ × (1 − FC₁) (MYCIN; las
   evidencias negativas restan). Resultado: probable (≥ 0,60), posible (≥ 0,35) o indeterminado,
   con la lista de reglas que se activaron.

Las reglas salen del análisis bibliográfico del informe (Lagos Burbano et al., 2020) y los
valores de FC son estimaciones del equipo: deben validarse con un agrónomo. El motor no
depende de React, así que puede portarse al backend o al móvil.

```bash
cd frontend && npm test   # pruebas del motor de reglas
```
