*&---------------------------------------------------------------------*
*& BORRADOR, NO COMPILADO NI PROBADO EN SAP.
*& Módulo de funciones RFC (SE37) ZSD_ALTA_CLIENTE, grupo de funciones ZSD_ALTA.
*& Se publica como web service SOAP en SOAMANAGER (ver SAP_WS_ESPECIFICACION.md).
*& Los valores marcados con TODO los define el equipo funcional de SAP.
*&---------------------------------------------------------------------*
*" Interfaz (SE37 > Atributos: "Módulo de funciones habilitado para RFC")
*"  IMPORTING
*"     VALUE(I_FOLIO)        TYPE  CHAR10
*"     VALUE(I_VKBUR)        TYPE  VKBUR        " oficina de ventas (MONT, ORIZ...)
*"     VALUE(I_VWERK)        TYPE  WERKS_D      " centro suministrador (KFMY)
*"     VALUE(I_NAME1)        TYPE  NAME1_GP     " razón social
*"     VALUE(I_NAME2)        TYPE  NAME2_GP     " nombre comercial
*"     VALUE(I_STCD1)        TYPE  STCD1        " RFC
*"     VALUE(I_STRAS)        TYPE  STRAS_GP
*"     VALUE(I_CITY2)        TYPE  ORT02_GP     " colonia
*"     VALUE(I_ORT02)        TYPE  ORT02_GP     " delegación
*"     VALUE(I_PSTLZ)        TYPE  PSTLZ
*"     VALUE(I_ORT01)        TYPE  ORT01_GP     " ciudad
*"     VALUE(I_REGIO)        TYPE  REGIO        " estado
*"     VALUE(I_TELF1)        TYPE  TELF1
*"     VALUE(I_ZTERM_DIAS)   TYPE  CHAR3        " días de crédito
*"     VALUE(I_KLIMK)        TYPE  KLIMK        " límite de crédito
*"     VALUE(I_ZLSCH)        TYPE  CHAR2        " forma de pago SAT
*"     VALUE(I_METODO_PAGO)  TYPE  CHAR3        " PUE / PPD
*"     VALUE(I_USO_CFDI)     TYPE  CHAR40
*"     VALUE(I_KDGRP)        TYPE  CHAR40       " canal -> grupo de clientes
*"  EXPORTING
*"     VALUE(E_KUNNR)        TYPE  KUNNR
*"     VALUE(E_MESSAGE)      TYPE  CHAR255
*"  TABLES
*"      IT_DESTINATARIOS     STRUCTURE ZSD_ALTA_DEST      " ver especificación
*"      IT_PRECIOS           STRUCTURE ZSD_ALTA_PRECIO
*"      ET_DEST              STRUCTURE ZSD_ALTA_DEST_SAP  " POSNR, KUNWE
*&---------------------------------------------------------------------*
FUNCTION zsd_alta_cliente.

  CONSTANTS: c_vkorg TYPE vkorg VALUE 'XXXX',   " TODO org. de ventas
             c_vtweg TYPE vtweg VALUE 'XX',     " TODO canal de distribución
             c_spart TYPE spart VALUE 'XX',     " TODO sector
             c_ref   TYPE kunnr VALUE 'XXXXXXXXXX'. " TODO cliente de referencia

  DATA: ls_pers   TYPE bapikna101_1,
        ls_copy   TYPE bapikna102,
        lv_kunnr  TYPE kunnr,
        ls_return TYPE bapireturn1,
        lt_kna1   TYPE STANDARD TABLE OF kna1.

  CLEAR: e_kunnr, e_message.

  " 1. Duplicados por RFC
  SELECT SINGLE kunnr FROM kna1 INTO lv_kunnr WHERE stcd1 = i_stcd1.
  IF sy-subrc = 0.
    e_message = |El RFC { i_stcd1 } ya existe como cliente { lv_kunnr }|.
    RETURN.
  ENDIF.

  " 2. Cliente solicitante (sold-to) copiando la referencia de ventas
  ls_pers-lastname   = i_name1.
  ls_pers-firstname  = i_name2.
  ls_pers-street     = i_stras.
  ls_pers-district   = i_city2.
  ls_pers-postl_cod1 = i_pstlz.
  ls_pers-city       = i_ort01.
  ls_pers-region     = i_regio.
  ls_pers-country    = 'MX'.
  ls_pers-langu_p    = 'S'.
  ls_pers-telephone  = i_telf1.
  ls_copy-salesorg   = c_vkorg.
  ls_copy-distr_chan = c_vtweg.
  ls_copy-division   = c_spart.
  ls_copy-ref_custmr = c_ref.

  CALL FUNCTION 'BAPI_CUSTOMER_CREATEFROMDATA1'
    EXPORTING
      pi_personaldata = ls_pers
      pi_copyreference = ls_copy
    IMPORTING
      customerno      = lv_kunnr
      return          = ls_return.
  IF ls_return-type CA 'EA' OR lv_kunnr IS INITIAL.
    ROLLBACK WORK.
    e_message = ls_return-message.
    RETURN.
  ENDIF.

  " 3. TODO: completar datos que la BAPI no cubre (RFC STCD1, condición de pago ZTERM
  "          según I_ZTERM_DIAS, vía de pago, oficina de ventas I_VKBUR, grupo I_KDGRP,
  "          campos Z de régimen fiscal / uso CFDI): BAPI_CUSTOMER_CHANGEFROMDATA1 o
  "          BADI/BDC de XD02, según lo que use hoy el equipo de SAP.

  " 4. TODO: límite de crédito I_KLIMK en el área de control de crédito (FD32 / KNKK),
  "          solo cuando I_KLIMK > 0.

  " 5. Destinatarios de mercancía: un cliente por cada línea de IT_DESTINATARIOS,
  "    con grupo de cuentas de destinatario y función de interlocutor WE ligada al sold-to.
  LOOP AT it_destinatarios.
    " TODO: crear destinatario (BAPI_CUSTOMER_CREATEFROMDATA1 con cuenta de destinatario)
    "       y registrar la función WE en KNVP.
    " ET_DEST-POSNR = it_destinatarios-posnr.
    " ET_DEST-KUNWE = <número creado>.
    " APPEND et_dest.
  ENDLOOP.

  " 6. Precios (IT_PRECIOS): v1 no se graban. Se envían por correo para liberación.
  "    TODO opcional: BAPI_PRICES_CONDITIONS para crear los registros de condición.

  CALL FUNCTION 'BAPI_TRANSACTION_COMMIT' EXPORTING wait = 'X'.
  e_kunnr   = lv_kunnr.
  e_message = |Cliente { lv_kunnr } creado (folio { i_folio })|.

ENDFUNCTION.
