# Rutek

Panel web para gestión de rutas, pedidos, flota y evidencias de entrega (multi-tenant).

Repositorio hermano del backend: **rutek-api** (NestJS + Prisma + PostgreSQL).

## Desarrollo local

```bash
npm install
cp .env.example .env   # VITE_API_URL=http://localhost:4000
npm run dev            # http://localhost:5173
```

Levantar API y Postgres según `rutek-api/README.md`.

## Documentación

| Documento | Descripción |
|-----------|-------------|
| [docs/README.md](./docs/README.md) | Índice |
| [docs/vision-general.md](./docs/vision-general.md) | Visión, actores, módulos |
| [docs/arquitectura.md](./docs/arquitectura.md) | Diagramas de arquitectura |
| [docs/flujos-secuencia.md](./docs/flujos-secuencia.md) | Diagramas de secuencia |

Demo producción: `https://rutek.mardev.cl`
