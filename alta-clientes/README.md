# Alta de clientes Cafiver

App web interna para capturar solicitudes de alta de cliente (formato CSC-FOR-019), autorizarlas y enviarlas a SAP ECC 6.0.

Flujo: vendedor captura → jefe fijo autoriza → jefe/admin pulsa **Enviar a SAP** → SAP devuelve el número de cliente → correo de aviso.

## Piezas
- `alta-clientes/index.html` y `config.js`: la app (Supabase Auth con correo y contraseña, GitHub Pages compatible).
- `supabase/migrations/20261009000000_alta_clientes.sql`: tablas `ac_*`, reglas de acceso (RLS), funciones de autorizar/rechazar y bucket privado `ac-documentos`.
- `supabase/functions/enviar-sap/index.ts`: función que llama al web service SOAP de SAP y manda el correo. Sin `SAP_WS_URL` corre en modo **simulado**.

## Puesta en marcha
1. Elegir el proyecto Supabase, aplicar la migración y desplegar la función.
2. Poner `SUPABASE_URL` y la clave publishable en `alta-clientes/config.js`.
3. Crear usuarios en Authentication. Luego, en la tabla `ac_perfiles`, asignar `rol` (`vendedor`, `jefe`, `admin`), `jefe_id` y `oficina`.
4. Secretos de la función: `SAP_WS_URL`, `SAP_WS_USER`, `SAP_WS_PASS`, `SAP_WS_NS`, `SAP_WS_FUNCTION`, `RESEND_API_KEY`, `CORREO_REMITENTE`, `CORREO_COPIA`.

## Reglas de la constancia fiscal
La app lee el PDF en el navegador (RFC, razón social, domicilio, estatus y fecha de emisión). Bloquea el envío si la constancia tiene más de 30 días (`CSF_VIGENCIA_DIAS`), si el estatus no es ACTIVO o si RFC y C.P. no coinciden con el formulario.

## Pendiente de confirmar
- WSDL real del servicio de alta en SAP (los nombres de campo en `buildEnvelope` son una propuesta).
- Significado y catálogos de sector, unidades de medida y centros suministradores.
