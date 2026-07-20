# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/rutek/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.

---

**Project:** Rutek  
**Generated:** 2026-07-17  
**Category:** Logistics / fleet operations SaaS

---

## Adaptación Rutek (obligatoria)

El generador `ui-ux-pro-max` sugiere Fira + fondo `#EFF6FF` + CTA naranja. **No se aplica a ciegas:**

- Colores: tokens existentes (`primary-*` ≈ `#2563EB`, `stone`, `canvas`, `surface`).
- Tipografía: Inter. `font-mono` solo para códigos / patentes / montos tabulares.
- Componentes: `Button`, `Badge`, `EmptyState`, Lucide — sin emojis.
- Estilo objetivo: **real-time monitoring**, densidad, status indicators.
- Evitar: glassmorphism, WebGL, emojis como iconos, hover con scale que mueva layout.

## Color Palette (referencia skill → tokens Rutek)

| Role | Skill hex | Token Rutek |
|------|-----------|-------------|
| Primary | `#2563EB` | `primary-600` |
| Secondary | `#3B82F6` | `primary-500` |
| CTA | `#F97316` | usar con moderación; preferir `Button` primary |
| Text | — | `stone-900` / `stone-600` muted |

## Style

**Real-Time Monitoring** — status indicators, alertas, datos vivos (SSE en valorización).

## Pre-Delivery Checklist

- [ ] No emojis as icons (Lucide)
- [ ] `cursor-pointer` on clickable rows/cards
- [ ] Hover `transition-colors duration-200`
- [ ] Light mode contrast ≥ 4.5:1
- [ ] Focus states visibles
- [ ] `motion-safe:` / `prefers-reduced-motion`
- [ ] Responsive 375 / 768 / 1024 / 1440
