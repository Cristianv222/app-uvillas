# Decisiones de arquitectura

1. **Monolito modular**: un solo despliegue Django; cada módulo es independiente por capas y se comunica con los demás por imports de `application`/`infrastructure` solo cuando es imprescindible (p. ej. `sync` conoce los modelos de `farms` y `scans`).
2. **Clean Architecture sin extremos**: `domain` y `application` no dependen de Django. Los CRUD simples (fincas, diagnósticos) usan ViewSets de DRF en `interfaces` y delegan reglas a casos de uso.
3. **Un modelo TFLite por parte** (hojas, tallos, frutos). Misma fuente (`ml-models/`) para teléfono y servidor.
4. **Offline primero**: el teléfono reconoce, guarda y reporta sin internet; `sync` reconcilia con el servidor (último cambio gana, borrado lógico, UUID generados en el cliente).
5. **WebSocket opcional**: el reconocimiento en el teléfono es el camino por defecto; el WebSocket usa el modelo del servidor cuando el usuario lo elige y hay internet.
6. **JWT**: access 15 min + refresh 30 días con rotación y lista negra. En el móvil, en `expo-secure-store`.
