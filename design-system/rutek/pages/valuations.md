# Valuations — overrides Rutek

> Override de `MASTER.md`. Mantener tokens Rutek (`primary`, `stone`, `surface`).

## Objetivo UX

Dashboard financiero de **monitoring**: KPIs primero, cobertura de flujos visible, detalle por ruta denso pero legible.

## Layout

1. Intro + acciones (flujos / filtros) + indicador live SSE
2. KPIs (cobro, pagos, margen) + cobertura de clientes con flujo
3. Tarifas del tenant (colapsable existente)
4. Clientes ↔ plantillas
5. Filtros
6. Detalle por ruta

## Reglas

- Color no es el único indicador: margen con signo + tono; flujo con badge + texto.
- Errores / mensajes de asignación con `role="alert"` o `role="status"`.
- Tablas con hover `transition-colors duration-200` y filas densas.
- Filtros activos con indicador visible (punto / contador).
- CTA primario de la página: Flujos de cobro (no naranja global; usar `Button` primary/secondary del DS).
