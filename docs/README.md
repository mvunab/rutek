# Documentación Rutek

Documentación de alto nivel del producto **Rutek**: plataforma multi-tenant para gestión de rutas, pedidos, flota y evidencias de entrega.

Rutek se compone de **dos repositorios** desplegados juntos:

| Repositorio | Stack | Rol |
|-------------|-------|-----|
| **rutek** | Vite, React 19, Zustand, Tailwind | Panel web operativo y super-admin |
| **rutek-api** | NestJS, Prisma, PostgreSQL | API REST, auth JWT, almacenamiento |

---

## Índice

| Documento | Contenido |
|-----------|-----------|
| [Visión general](./vision-general.md) | Propósito, actores, módulos y stack |
| [Arquitectura](./arquitectura.md) | Diagramas de contexto, contenedores, despliegue y dominio |
| [Flujos (secuencia)](./flujos-secuencia.md) | Diagramas de secuencia de los procesos principales |

### Documentación por módulo (API)

En el repositorio **rutek-api** (carpeta hermana):

- [Módulo de vehículos](../../rutek-api/docs/modulo-vehiculos.md) — flota, cumplimiento documental, MinIO

### Referencias rápidas

- Swagger (dev): `http://localhost:4000/api/docs`
- Demo prod: `https://rutek.mardev.cl`
- Scripts de deploy: `rutek-api/deploy/`

---

## Convenciones

- Los diagramas usan [Mermaid](https://mermaid.js.org/); se renderizan en GitHub y en editores compatibles.
- **RM-N** en el código alude a requisitos de negocio numerados (p. ej. RM-1 = asignación por pedido).
- Persistencia en PostgreSQL con columnas `snake_case`; la API expone camelCase en JSON.
