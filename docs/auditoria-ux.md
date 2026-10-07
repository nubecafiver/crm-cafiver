# Auditoría UI/UX: prototipo Cafiver CRM

**Alcance:** las 13 pantallas `cafiver_*.html` (7 de escritorio y 6 móviles) más `index.html`. Los archivos `crm_cafiver_*.html` son una versión anterior: usan Space Grotesk/Inter y fondo oscuro, `index.html` no los enlaza y no se auditaron a detalle (ver P2-4).

**Método:** análisis estático del marcado y cálculo de contraste WCAG a partir de los tokens de color de la configuración de Tailwind de cada archivo. Desde el entorno de auditoría la política de red bloqueó el CDN de Tailwind y Google Fonts, así que las pantallas no pudieron renderizarse con estilos. Por eso los tamaños provienen de las clases (`w-9` = 36 px, etc.) y no de medir en pantalla. Esto conviene confirmarlo en un dispositivo real.

**Lo que está bien:** paleta única sin variaciones entre archivos (los valores de cada token coinciden en todas las pantallas), `lang="es"`, meta viewport, un `<main>` por pantalla, escala tipográfica definida, sin desbordamiento horizontal en móvil y los pares de color principales (`on-*-container` sobre `*-container`, `on-surface-variant`) pasan AA.

---

## P0: Crítico (accesibilidad / uso en campo)

### 1. Botones de solo ícono sin nombre accesible (19 casos)
Material Symbols renderiza el ícono a partir de texto. Un lector de pantalla anuncia "notifications", "add" o "remove", en inglés, o sea, nada útil. No hay ningún `aria-label` ni `aria-hidden` en todo el repo.
- `cafiver_tablero_movil.html:61` (notificaciones), `:162` (FAB "+")
- `cafiver_pedido_movil.html:86-88` (stepper − / +)
- `cafiver_rutas_*` (`my_location`, zoom), `cafiver_clientes_lista_*`, `cafiver_agenda_movil`, `cafiver_detalle_cliente`

**Corrección:** `aria-label="Notificaciones"` en el botón y `aria-hidden="true"` en **todos** los `<span class="material-symbols-outlined">`, también en los que acompañan texto, para que no se lea "groups Clientes".

### 2. Objetivos táctiles menores a 44 px en la app de campo
El vendedor usa la app de pie, con una mano y a menudo en movimiento.
- Stepper de cantidad en Pedido: `w-9 h-9` = **36 px**, con un "+" que suma de 5 en 5 (`cafiver_pedido_movil.html:86-92`). Es el control más usado de la app.
- Enlaces "Ver ruta" y "Ver todo": texto sin padding, unos 20 px de alto.
- Avatar/acciones de la barra superior: 32 a 40 px.

**Corrección:** mínimo `min-w-11 min-h-11` (44 px) y 8 px de separación entre controles. Para el stepper, considerar `w-11 h-11` más un campo numérico editable (`inputmode="numeric"`) para capturar cantidades grandes sin 20 toques.

### 3. Sin estilos de foco visibles
11 de 14 pantallas no tienen ningún `focus:`/`focus-visible:`. Las que sí los tienen solo los aplican a inputs. La navegación con teclado en la consola de escritorio es invisible.

**Corrección:** una regla global en cada `<style>`:
```css
:focus-visible { outline: 2px solid #005da9; outline-offset: 2px; }
```

### 4. El embudo solo funciona con arrastrar y soltar
`cafiver_embudo_escritorio.html:99,124` usa `draggable` + `dragstart` sin alternativa. No se puede mover una oportunidad con teclado ni en tablet táctil, porque el DnD HTML5 no funciona con touch (WCAG 2.5.7).

**Corrección:** en cada tarjeta, un menú "Mover a…" (botón ⋯ con la lista de etapas), además del arrastre.

---

## P1: Alto

### 5. Contraste insuficiente
| Caso | Ratio | Mínimo | Dónde |
|---|---|---|---|
| `text-outline` (#717784) como texto | 4.49 sobre blanco, 4.28 sobre `surface` | 4.5 | 35 usos: tablero escritorio, clientes, ficha, rutas móvil |
| Ícono blanco sobre `secondary-container` (#43beff) | 2.09 | 3.0 (no textual) | `cafiver_detalle_cliente.html:285` (bitácora, correo) |
| Badge "stock bajo": #8a6508 sobre `tertiary-fixed` (verde) | 4.13 | 4.5 | `cafiver_pedido_escritorio.html:111` |
| `text-primary opacity-80` | 4.23 a 4.39 | 4.5 | `cafiver_cliente_detalle_movil.html` |

**Corrección:** usar `on-surface-variant` (#414752, 8:1) en lugar de `outline` para texto; reservar `outline` solo para bordes. Para el ícono de bitácora usar `text-on-secondary-container`. El badge de stock bajo además está en **fondo verde**, que comunica "bien": cambiarlo a un fondo ámbar (p. ej. `#fff4d6` con texto `#6b4e00`).

### 6. Navegación del prototipo rota
Toda la navegación interna (sidebar de escritorio y barra inferior móvil) usa `href="#"`: 101 enlaces muertos. El único flujo enlazado es Clientes ↔ Ficha (móvil). Para una demo con dirección, hay que volver siempre a `index.html`.

**Corrección:** enlazar sidebar y bottom nav a sus archivos y marcar la página activa con `aria-current="page"`, que hoy solo se indica con color.

### 7. Inconsistencias de navegación móvil
- La app de campo tiene 6 pantallas (incluye **Agenda**), pero la barra inferior solo tiene 4 ítems (Inicio, Clientes, Pedidos, Rutas). Agenda es inalcanzable.
- Por debajo de 1024 px la consola de escritorio oculta el sidebar (`hidden lg:flex`) y muestra una barra inferior con texto de **10 px** (`text-[10px]`, `cafiver_tablero_escritorio.html:265`) que pierde Embudo, Agenda y Reportes. En una laptop pequeña o una tablet, dirección pierde la mitad del producto.

**Corrección:** 5 ítems en la barra móvil (Inicio, Clientes, Pedidos, Rutas, Agenda). En escritorio < lg, sidebar colapsable (solo íconos, con etiqueta en tooltip) en lugar de barra inferior.

### 8. Pestañas sin semántica
`cafiver_cliente_detalle_movil.html:96-98`: Resumen / Bitácora / Contacto son `<button>` sueltos. Faltan `role="tablist"`/`tab`/`tabpanel`, `aria-selected` y el manejo con flechas.

### 9. Estados deshabilitados solo visuales
En Pedido móvil, los productos sin stock usan `opacity-40` y una guarda en JS, pero el botón no tiene `disabled`. El lector de pantalla lo anuncia como activo y no hay texto que explique "Sin stock".

---

## P2: Medio

1. **Texto pequeño:** `label-sm` (11 px) aparece 175 veces, a menudo para información real (estado del cliente, montos secundarios, etiquetas de la barra inferior), y hay 23 usos de 10 px. Subir `label-sm` a 12 px y eliminar los de 10 px. En campo, con sol directo, 11 px es difícil de leer.
2. **Tarjetas que parecen tocables pero no lo son:** las tarjetas de KPI y "Próximas visitas" en Inicio móvil tienen `ios-active` (se encogen al tocarlas) pero son `<div>` sin acción. O se convierten en `<a>` hacia la ficha o la ruta, o se quita el efecto.
3. **Sin `prefers-reduced-motion`:** agregar `@media (prefers-reduced-motion: reduce){ *{transition:none!important;animation:none!important} }`.
4. **Archivos heredados:** `crm_cafiver_campo.html`, `crm_cafiver_demo.html` y `crm_cafiver_direccion.html` usan otro sistema visual (Space Grotesk/Inter, tema oscuro) y `campo` depende de un `firebase` no cargado. Si ya no aplican, moverlos a `/legacy` o eliminarlos para evitar confusión.
5. **Configuración duplicada:** cada pantalla repite completa la configuración de Tailwind (paleta, tipografía). Hoy coinciden, pero cualquier ajuste de marca hay que hacerlo 13 veces. Extraerla a un `tokens.js` compartido.
6. **Áreas seguras iOS:** la barra inferior y el FAB son `fixed bottom-0` sin `env(safe-area-inset-bottom)`. En iPhone con barra de gestos (y en la PWA instalada) quedan debajo del indicador de inicio. Agregar `padding-bottom: env(safe-area-inset-bottom)` y `viewport-fit=cover`.
7. **Feedback de acciones:** "Confirmar pedido", "Check-in" y "Evidencia" no tienen estado de carga, éxito o error. Para la fase de construcción (SAP/Firestore con conectividad intermitente) conviene diseñar ya los estados "enviando…", "guardado sin conexión" y "error, reintentar".

---

## Orden sugerido
1. P0-1 y P0-3 (aria + foco): cambio mecánico en todos los archivos, alto impacto.
2. P0-2 (stepper y objetivos táctiles en Pedido móvil).
3. P1-6 y P1-7 (navegación enlazada y Agenda en barra móvil): mejora la demo para dirección de inmediato.
4. P1-5 (contraste: reemplazar `text-outline`).
5. El resto según la fase de construcción.
