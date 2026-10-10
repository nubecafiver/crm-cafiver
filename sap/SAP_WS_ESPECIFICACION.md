# Web service de alta de cliente (SAP ECC 6.0)

El servicio vive en SAP: un módulo de funciones RFC `ZSD_ALTA_CLIENTE` publicado como web service SOAP.
La función `enviar-sap` de Supabase lo llama con usuario técnico y lee el número de cliente en la respuesta.

## Publicarlo
1. SE37: crear `ZSD_ALTA_CLIENTE` (código base en `ZSD_ALTA_CLIENTE.abap`), habilitado para RFC, con las estructuras Z de las tablas.
2. SE80 > clic derecho al módulo > Crear > Servicio empresarial (Enterprise Service) o SOAMANAGER > Administración de servicios web > Definición de servicio.
3. SOAMANAGER: autenticación usuario/contraseña, transporte HTTPS, activar.
4. Entregar: URL del endpoint, WSDL, usuario técnico con permisos de XD01/XD02 y de la BAPI. Estos van como secretos `SAP_WS_URL`, `SAP_WS_USER`, `SAP_WS_PASS`, `SAP_WS_NS`, `SAP_WS_FUNCTION`.
5. SAP debe ser alcanzable desde internet (o por VPN/reverse proxy) porque Supabase llama desde la nube.

## Contrato de entrada (campos que envía la app)
| Parámetro | Contenido |
|---|---|
| I_FOLIO, I_VKBUR, I_VWERK | folio, oficina de ventas, centro suministrador |
| I_NAME1, I_NAME2, I_STCD1 | razón social, nombre comercial, RFC |
| I_STRAS, I_CITY2, I_ORT02, I_PSTLZ, I_ORT01, I_REGIO, I_TELF1 | domicilio fiscal y teléfono |
| I_ZTERM_DIAS, I_KLIMK | días y límite de crédito |
| I_ZLSCH, I_METODO_PAGO, I_USO_CFDI, I_KDGRP | forma/método de pago, uso CFDI, canal |
| IT_DESTINATARIOS | POSNR, STRAS, CITY2, ORT02, PSTLZ, ORT01, REGIO, TELF1, ENTRE_CALLES, HORARIO_ENTREGA, REFERENCIAS |
| IT_PRECIOS | MATNR, VRKME, KBETR, DATAB, DATBI |

Salida: `E_KUNNR` (número de cliente), `E_MESSAGE` (mensaje o error), `ET_DEST` (POSNR + KUNWE de cada destinatario).

## Lo que necesito del equipo SAP para cerrarlo
1. Un consultor ABAP o acceso a DEV para compilar y probar el módulo (yo no puedo ejecutarlo contra tu SAP).
2. Org. de ventas, canal y sector; grupo de cuentas del cliente y del destinatario; cuenta de conciliación.
3. Un cliente de referencia por canal para copiar datos de ventas.
4. Cómo se traducen los días de crédito a condición de pago (ZTERM) y la forma de pago SAT a vía de pago.
5. Dónde se guardan hoy régimen fiscal y uso de CFDI (campos Z).
6. Cómo se asigna el límite de crédito (área de control de crédito, FD32).
7. Si los precios se graban por el servicio o se liberan a mano con el correo (en el pizarrón dice "precios por liberar").
8. Significado de los sectores (FC, CK, RT, EQ, PQ, RF, TZ, AZ, SR, IN) y a qué campo SAP van.
9. WSDL generado en SOAMANAGER para ajustar `buildEnvelope()` en `supabase/functions/enviar-sap/index.ts`.
