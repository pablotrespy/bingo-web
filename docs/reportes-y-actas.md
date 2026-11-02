# Diseño de reportes y libros de actas

La información se organiza por organización, local, jornada y jugada.

## Jornada

Una jornada tiene apertura y cierre manual. `business_date` identifica el día operativo, mientras `opened_at` y `closed_at` conservan la fecha y hora real. Esto permite jornadas que comienzan un día y terminan al siguiente.

## Trazabilidad de una jugada

Cada jugada conserva ventas, cartones asignados, extracciones ordenadas y premios. Los ganadores se almacenan en una tabla relacionada, no en columnas fijas, para soportar cualquier cantidad de ganadores.

## Reportes futuros

- Acta diaria por local y jornada.
- Consolidado mensual por local.
- Consolidado anual por local.
- Consolidado de todos los locales de una organización.
- Indicadores de ventas, clientes, recaudo, premios y comportamiento comercial.

La migración SQL asociada está en `api/sql/20261102_reporting_foundation.sql`. En esta etapa solo queda versionada; su aplicación se hará junto con el módulo operativo de jornadas y cierre manual.
