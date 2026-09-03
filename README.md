# Rutek

Panel web para gestión de rutas, pedidos, flota y evidencias de entrega (multi-tenant).

Repositorio hermano del backend: **rutek-api** (NestJS + Prisma + PostgreSQL).

## Desarrollo local

### Backend + infra (Docker, recomendado)

```bash
cd ../rutek-api
cp .env.docker.example .env
docker compose up -d --build
docker compose ps          # rutek-api debe estar Up (healthy)
curl http://127.0.0.1:4000/health
```

**Verde ≠ healthy:** si solo ves Postgres/MinIO en Docker Desktop y el front falla con `ERR_CONNECTION_REFUSED` a `:4000`, el contenedor `rutek-api` está caído. Checklist: [rutek-api/docs/FRONTEND_DOCKER.md](../rutek-api/docs/FRONTEND_DOCKER.md) · Stack: [rutek-api/docs/DOCKER.md](../rutek-api/docs/DOCKER.md).

### Frontend

```bash
npm install
cp .env.example .env   # VITE_API_URL=http://localhost:4000
# En Windows, si hace falta: VITE_API_URL=http://127.0.0.1:4000
# Reiniciar Vite tras cambiar .env
npm run dev            # http://localhost:5173
```

Login demo (con API Docker): `admin@demo.rutek` / `CambiarDemo2026!`

Alternativa: API en el host según [rutek-api/README.md](../rutek-api/README.md).

## Documentación

| Documento | Descripción |
|-----------|-------------|
| [docs/README.md](./docs/README.md) | Índice |
| [docs/vision-general.md](./docs/vision-general.md) | Visión, actores, módulos |
| [docs/arquitectura.md](./docs/arquitectura.md) | Diagramas de arquitectura |
| [docs/flujos-secuencia.md](./docs/flujos-secuencia.md) | Diagramas de secuencia |

Demo producción: `https://rutek.mardev.cl`
