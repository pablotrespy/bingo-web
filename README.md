# Bingo Web

Plataforma de operación para bingo de 90 números, con API NestJS, frontend Next.js y PostgreSQL.

## Estructura

- `api/`: backend y servicios de juegos, ventas y premios.
- `web/`: frontend operativo.
- `docker-compose.yml`: PostgreSQL local.
- `backups/`: respaldos locales, excluidos del repositorio.

## Desarrollo

```powershell
docker compose up -d
cd api; npm run start:dev
cd ../web; npm run dev
```

La base utiliza el catálogo validado de 24.000 cartones. Las variables locales se mantienen en archivos `.env` y no se versionan.
