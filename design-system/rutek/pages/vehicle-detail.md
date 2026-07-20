# Vehicle Detail — overrides Rutek

> Override de `MASTER.md`. Prioriza el design system existente de la app (tokens Tailwind `primary` / `stone` / `canvas`, Inter, Lucide).

## Objetivo UX

Ficha operativa tipo **real-time monitoring**: estado del activo, alertas de compliance y actividad reciente escaneables.

## Layout

1. Toolbar (volver / editar / eliminar)
2. Hero de identificación (patente + estado live)
3. KPI strip (4 métricas)
4. Identificación + resumen operativo (2 columnas)
5. Documentación / vencimientos (grid)
6. Rutas y pedidos recientes (listas clicables)

## Reglas

- Indicador de disponibilidad con punto + texto (no solo color).
- Alertas de documentación: icono + conteo + tono amber/red.
- Filas de rutas/pedidos: `cursor-pointer`, hover `transition-colors duration-200`, navegables.
- KPIs con acento lateral sutil; números `tabular-nums`.
- Respetar `prefers-reduced-motion` (pulse solo con `motion-safe:`).
- No cambiar tipografía global a Fira; usar `font-mono` solo en patente/VIN/códigos.
