# Cafiver CRM

Sistema CRM para la operación de ventas en campo de **Cafiver** (tostado y molido de café · Ixtaczoquitlán / Córdoba, Veracruz).

Prototipo navegable con el sistema de diseño **Enterprise Core** (estilo Salesforce Lightning · Hanken Grotesk · azul `#0176d3`), en dos productos: **consola de escritorio** (dirección) y **app de campo** (vendedor).

## Ver el prototipo

Punto de entrada: **[index.html](./index.html)** — mapa de todas las pantallas.

Publicado en GitHub Pages: `https://nubecafiver.github.io/crm-cafiver/`

## Pantallas

**Escritorio (dirección)**
- Tablero — KPIs, ventas por mes y negocios prioritarios
- Embudo — kanban de 5 etapas (Prospecto → Cotización → Pedido → Facturado → Ganado)
- Clientes — cartera con filtros por CEDI, vendedor y estado
- Ficha de cliente — embudo, métricas y bitácora de actividad
- Pedido — catálogo con stock SAP en vivo
- Rutas — planeación con mapa y paradas
- Agenda — rejilla mensual y agenda del día

**App de campo (vendedor)**
- Inicio, Clientes, Ficha de cliente, Pedido, Rutas, Agenda

## Los tres pilares

1. Captura de pedidos en campo
2. Seguimiento de la relación con el cliente
3. Gestión del embudo de ventas

## Stack objetivo

SAP ECC 6.0 (inventario y creación de pedidos vía BAPI/RFC) · Firebase / Firestore · PWA instalable (GPS, evidencia fotográfica, notificaciones).

## Estado

Prototipo de diseño para alineación de dirección. Datos de ejemplo con escala realista; el mapa de Rutas es esquemático. La integración SAP y la conexión a Firestore corresponden a la fase de construcción.
