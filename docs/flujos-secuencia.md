# Flujos de secuencia

Diagramas de secuencia de los procesos principales de Rutek. Nivel alto: omiten validaciones y errores salvo donde son relevantes.

---

## 1. Autenticación y sesión

```mermaid
sequenceDiagram
  autonumber
  actor U as Usuario
  participant SPA as rutek (React)
  participant Guard as BackendGuard
  participant API as rutek-api
  participant DB as PostgreSQL

  U->>SPA: Abre app
  SPA->>Guard: montar app
  Guard->>API: GET /health
  API-->>Guard: 200 OK

  alt Sin token en localStorage
    SPA->>U: LoginPage
    U->>SPA: email + password
    SPA->>API: POST /auth/login
    API->>DB: find user + bcrypt compare
    API-->>SPA: access_token + user
    SPA->>SPA: guardar token
  else Token existente
    SPA->>API: GET /auth/me
    API-->>SPA: perfil + tenant
  end

  SPA->>U: Dashboard / rutas
```

---

## 2. Creación de pedido (origen y destino)

El origen por defecto proviene de la dirección del **mandante (cliente)** de la ruta; si no hay, de la **dirección del tenant**.

```mermaid
sequenceDiagram
  autonumber
  actor Op as Operador
  participant RP as RoutesPage
  participant Form as OrderForm
  participant Addr as orderAddress.ts
  participant Store as useOrderStore
  participant API as rutek-api
  participant DB as PostgreSQL

  Op->>RP: Nueva ruta / agregar pedido
  RP->>Form: abrir modal (cliente + route_id)
  Form->>Addr: resolveDefaultPickupAddress(client, tenant)
  Addr-->>Form: originStreet/City/Region
  Op->>Form: completa destino, bultos, prioridad
  Op->>Form: Guardar
  Form->>Store: addOrder(payload)
  Store->>API: POST /orders
  Note over API: origin_*, destination_*, route_id, client_id
  API->>DB: INSERT order
  API-->>Store: pedido creado
  Store->>RP: refrescar lista
  RP->>Op: tarjeta Origen → Destino
```

---

## 3. Importación Excel de ruta

Crea ruta + pedidos en lote; guarda copia del archivo en MinIO.

```mermaid
sequenceDiagram
  autonumber
  actor Op as Operador
  participant RP as RoutesPage
  participant Store as useRouteImportStore
  participant API as rutek-api
  participant XLS as route-import.service
  participant DB as PostgreSQL
  participant S3 as MinIO

  Op->>RP: Importar Excel
  Op->>RP: seleccionar archivo
  RP->>Store: preview(file)
  Store->>API: POST /route-import/preview (multipart)
  API->>XLS: parsear hoja + validar
  XLS-->>Store: preview (filas, errores)
  Store->>Op: modal confirmación

  Op->>Store: confirmar
  Store->>API: POST /route-import/confirm
  API->>XLS: crear Route + Orders
  XLS->>DB: INSERT route, orders (batch)
  XLS->>S3: backup Excel en imports/
  API-->>Store: route_id + resumen
  Store->>RP: navegar / refrescar rutas
```

---

## 4. Asignación masiva en ruta

Aplica chofer, peoneta, vehículo y/o destino a **pedidos seleccionados** (RM-1: persistencia por pedido).

```mermaid
sequenceDiagram
  autonumber
  actor Op as Operador
  participant RP as RoutesPage
  participant RS as useRouteStore
  participant OS as useOrderStore
  participant API as rutek-api
  participant DB as PostgreSQL

  Op->>RP: abrir panel lateral de ruta
  Op->>RP: seleccionar pedidos (checkbox)
  Op->>RP: elegir chofer, peoneta, vehículo, destino
  Op->>RP: Aplicar a N pedidos

  alt Equipo (chofer / peoneta / vehículo)
    RP->>RS: assignDriverToOrders(routeId, orderIds, …)
    RS->>API: PATCH /routes/:id/assign-driver
    API->>DB: UPDATE orders SET driver_id, peoneta_id, vehicle_id
  end

  alt Ubicación destino
    loop Por cada pedido seleccionado
      RP->>OS: updateOrder(id, destination*)
      OS->>API: PATCH /orders/:id
      API->>DB: UPDATE destination_*
    end
  end

  API-->>RP: OK
  RP->>Op: pedidos actualizados en tarjetas
```

---

## 5. Entrega o rechazo en campo

Flujo típico desde app móvil o web de chofer (RM-4).

```mermaid
sequenceDiagram
  autonumber
  actor Dr as Chofer
  participant App as App / web chofer
  participant API as rutek-api
  participant DB as PostgreSQL

  Dr->>App: ver pedido asignado
  alt Entrega exitosa
    Dr->>App: confirmar entrega + datos
    App->>API: PATCH /orders/:id/deliver
    API->>DB: UPDATE order status + delivery_record
  else Rechazo
    Dr->>App: motivo rechazo
    App->>API: PATCH /orders/:id/reject
    API->>DB: UPDATE order status + delivery_record
  end
  API-->>App: pedido actualizado
```

---

## 6. Subida de evidencia (foto)

Camino web multipart; la app móvil puede usar flujo presigned (documentado en API README).

```mermaid
sequenceDiagram
  autonumber
  actor Dr as Chofer
  participant App as Cliente
  participant API as rutek-api
  participant Storage as PhotoStorageService
  participant S3 as MinIO
  participant DB as PostgreSQL

  Dr->>App: capturar foto
  App->>API: POST /orders/:id/photos (multipart)
  API->>Storage: putObject(key, buffer)
  Storage->>S3: PUT objeto
  S3-->>Storage: OK
  Storage-->>API: file_url
  API->>DB: INSERT route_photo (order_id, route_id)
  API-->>App: foto registrada

  Note over App,DB: Galería web
  participant Web as PhotosPage
  Web->>API: GET /route-photos
  API->>DB: SELECT con tenant filter
  API-->>Web: lista + URLs /media/…
```

---

## 7. Seguimiento público

Sin autenticación; token opaco con vigencia limitada.

```mermaid
sequenceDiagram
  autonumber
  actor Op as Operador
  participant RP as RoutesPage
  participant API as rutek-api
  participant DB as PostgreSQL
  actor Dest as Destinatario
  participant Pub as /tracking/:token

  Op->>RP: enviar link seguimiento
  RP->>API: POST /communications/.../send-tracking
  API->>DB: INSERT tracking_token (order/route)
  API-->>Op: URL pública

  Dest->>Pub: abrir link
  Pub->>API: GET /public/route-tracking/:token
  API->>DB: validar token + vigencia
  API-->>Pub: estado ruta / pedidos
  Pub->>Dest: vista seguimiento
```

---

## 8. Reset de datos demo (operaciones)

Flujo usado en servidor para limpiar y resembrar (no es UI de producto).

```mermaid
sequenceDiagram
  autonumber
  actor Dev as Desarrollador
  participant Script as reset-prod-from-local.sh
  participant Srv as Servidor
  participant Prisma as prisma migrate reset
  participant DB as PostgreSQL
  participant MC as MinIO mc
  participant API as rutek-api

  Dev->>Script: ejecutar desde Mac
  Script->>Srv: rsync + deploy (opcional)
  Script->>Srv: reset-prod-data.sh
  Srv->>API: systemctl stop
  Srv->>Prisma: migrate reset --force
  Prisma->>DB: DROP + migraciones + seed.ts
  Srv->>MC: vaciar bucket rutek-media
  Srv->>API: systemctl start
  API-->>Dev: health OK + credenciales demo
```

---

## Referencias

- [Arquitectura](./arquitectura.md)
- [Visión general](./vision-general.md)
- OpenAPI: `http://localhost:4000/api/docs`
