// Envía una solicitud autorizada a SAP ECC 6.0 por web service (SOAP) y guarda el número de cliente.
//
// Secretos (supabase secrets set ...):
//   SAP_WS_URL        URL del web service de alta de cliente. Si no existe, corre en modo SIMULADO.
//   SAP_WS_USER / SAP_WS_PASS   usuario técnico SAP (autenticación básica)
//   SAP_WS_NS         namespace del servicio (por defecto el de un RFC expuesto como web service)
//   SAP_WS_FUNCTION   nombre de la función (por defecto ZSD_ALTA_CLIENTE)
//   RESEND_API_KEY, CORREO_REMITENTE, CORREO_COPIA   correo de aviso (opcional)
//
// Los nombres de campos SAP de buildEnvelope() y parseRespuesta() son una propuesta:
// se ajustan con el WSDL real del servicio de alta.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

const x = (v: unknown) =>
  String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const tag = (n: string, v: unknown) => `<${n}>${x(v)}</${n}>`;

// deno-lint-ignore no-explicit-any
function buildEnvelope(s: any): string {
  const ns = Deno.env.get("SAP_WS_NS") ?? "urn:sap-com:document:sap:rfc:functions";
  const fn = Deno.env.get("SAP_WS_FUNCTION") ?? "ZSD_ALTA_CLIENTE";
  const d = s.datos ?? {};
  const f = d.fiscal ?? {};
  const dest = (s.destinatarios ?? []).map((e: any, i: number) =>
    `<item>${tag("POSNR", i + 1)}${tag("STRAS", e.calle)}${tag("CITY2", e.colonia)}${tag("ORT02", e.delegacion)}` +
    `${tag("PSTLZ", e.cp)}${tag("ORT01", e.ciudad)}${tag("REGIO", e.estado)}${tag("TELF1", e.telefono)}` +
    `${tag("ENTRE_CALLES", e.entrecalles)}${tag("HORARIO_ENTREGA", e.horario_entrega)}${tag("REFERENCIAS", e.referencias)}</item>`
  ).join("");
  const prod = (s.productos ?? []).map((p: any) =>
    `<item>${tag("MATNR", p.material)}${tag("VRKME", p.um)}${tag("KBETR", p.precio)}${tag("DATAB", p.vigencia_desde)}${tag("DATBI", p.vigencia_hasta)}</item>`
  ).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="${ns}">
<soapenv:Header/><soapenv:Body><urn:${fn}>
${tag("I_FOLIO", s.folio)}${tag("I_VKBUR", s.oficina)}${tag("I_VWERK", d.centro_suministrador)}
${tag("I_NAME1", s.razon_social)}${tag("I_NAME2", s.nombre_comercial)}${tag("I_STCD1", s.rfc)}
${tag("I_STRAS", f.calle)}${tag("I_CITY2", f.colonia)}${tag("I_ORT02", f.delegacion)}${tag("I_PSTLZ", f.cp)}
${tag("I_ORT01", f.ciudad)}${tag("I_REGIO", f.estado)}${tag("I_TELF1", f.telefono)}
${tag("I_ZTERM_DIAS", d.dias_credito)}${tag("I_KLIMK", d.limite_credito)}
${tag("I_ZLSCH", d.forma_pago)}${tag("I_METODO_PAGO", d.metodo_pago)}${tag("I_USO_CFDI", d.uso_cfdi)}
${tag("I_KDGRP", d.canal)}
<IT_DESTINATARIOS>${dest}</IT_DESTINATARIOS><IT_PRECIOS>${prod}</IT_PRECIOS>
</urn:${fn}></soapenv:Body></soapenv:Envelope>`;
}

function parseRespuesta(xml: string) {
  const get = (n: string) => new RegExp(`<${n}[^>]*>([^<]*)</${n}>`).exec(xml)?.[1]?.trim() ?? "";
  const kunnr = get("E_KUNNR");
  const mensaje = get("E_MESSAGE") || get("faultstring");
  const dests = [...xml.matchAll(/<item>\s*<POSNR>(\d+)<\/POSNR>\s*<KUNWE>(\d+)<\/KUNWE>\s*<\/item>/g)]
    .map((m) => ({ posicion: Number(m[1]), numero_sap: m[2] }));
  return { kunnr, mensaje, dests };
}

// deno-lint-ignore no-explicit-any
async function enviarCorreo(s: any, numero: string, destinos: string[], simulado: boolean) {
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key || destinos.length === 0) return { enviado: false, motivo: "Correo no configurado" };
  const dest = (s.destinatarios ?? [])[0];
  const lim = s.datos?.limite_credito ? `$ ${Number(s.datos.limite_credito).toLocaleString("es-MX")} MXN` : "No aplica";
  const precios = (s.productos ?? []).map((p: any) =>
    `<tr><td>${x(p.material)} ${x(p.descripcion)}</td><td>${x(p.um)}</td><td>$${x(p.precio)}</td><td>${x(p.vigencia_desde)} al ${x(p.vigencia_hasta)}</td></tr>`).join("");
  const html = `<p>${simulado ? "<b>PRUEBA (SAP simulado)</b><br>" : ""}Se dio de alta el cliente <b>${x(s.razon_social)}</b>.</p>
<table cellpadding="4"><tr><td>Núm. cliente</td><td><b>${x(numero)}</b></td></tr>
<tr><td>Destinatario</td><td>${x(dest ? `${dest.calle}, ${dest.colonia}, ${dest.ciudad}` : "Igual al domicilio fiscal")}</td></tr>
<tr><td>Límite de crédito</td><td>${lim}</td></tr></table>
<p>Precios por liberar:</p><table border="1" cellpadding="4" cellspacing="0"><tr><th>Material</th><th>UM</th><th>Precio</th><th>Vigencia</th></tr>${precios}</table>`;
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: Deno.env.get("CORREO_REMITENTE") ?? "altas@cafiver.com.mx",
      to: destinos,
      subject: `Alta de cliente ${numero} · ${s.razon_social}`,
      html,
    }),
  });
  return { enviado: r.ok, estatus: r.status };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const auth = req.headers.get("Authorization") ?? "";
    const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const { data: u } = await userClient.auth.getUser();
    if (!u?.user) return json({ error: "Sesión no válida" }, 401);
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { id } = await req.json();
    const { data: s } = await admin.from("ac_solicitudes").select("*").eq("id", id).single();
    if (!s) return json({ error: "Solicitud no encontrada" }, 404);
    const { data: yo } = await admin.from("ac_perfiles").select("rol").eq("id", u.user.id).single();
    const permitido = yo?.rol === "admin" || (yo?.rol === "jefe" && s.jefe_id === u.user.id);
    if (!permitido) return json({ error: "No tienes permiso para enviar esta solicitud a SAP" }, 403);
    if (!["autorizada", "error_sap"].includes(s.estatus)) return json({ error: "La solicitud debe estar autorizada" }, 409);

    const sapUrl = Deno.env.get("SAP_WS_URL");
    const simulado = !sapUrl;
    let numero = "", dests: { posicion: number; numero_sap: string }[] = [], mensaje = "";
    if (simulado) {
      numero = String(1000000 + Math.floor(Math.random() * 899999));
      dests = (s.destinatarios ?? []).map((_: unknown, i: number) => ({ posicion: i + 1, numero_sap: String(Number(numero) + i + 1) }));
      mensaje = "Alta simulada: SAP_WS_URL no está configurado";
    } else {
      const basic = btoa(`${Deno.env.get("SAP_WS_USER")}:${Deno.env.get("SAP_WS_PASS")}`);
      const res = await fetch(sapUrl, {
        method: "POST",
        headers: { "Content-Type": "text/xml; charset=utf-8", SOAPAction: '""', Authorization: `Basic ${basic}` },
        body: buildEnvelope(s),
      });
      const xml = await res.text();
      const p = parseRespuesta(xml);
      numero = p.kunnr; dests = p.dests; mensaje = p.mensaje;
      if (!res.ok || !numero) {
        await admin.from("ac_solicitudes").update({ estatus: "error_sap", sap_log: { http: res.status, mensaje: mensaje || xml.slice(0, 500) } }).eq("id", id);
        await admin.from("ac_eventos").insert({ solicitud_id: id, usuario_id: u.user.id, accion: "error_sap", comentario: mensaje || `HTTP ${res.status}` });
        return json({ error: mensaje || `SAP respondió HTTP ${res.status}` }, 502);
      }
    }

    await admin.from("ac_solicitudes").update({
      estatus: "en_sap", num_cliente_sap: numero, destinatarios_sap: dests, sap_at: new Date().toISOString(),
      sap_log: { simulado, mensaje },
    }).eq("id", id);
    await admin.from("ac_eventos").insert({ solicitud_id: id, usuario_id: u.user.id, accion: "alta_en_sap", comentario: `Cliente ${numero}${simulado ? " (simulado)" : ""}` });

    const { data: perfiles } = await admin.from("ac_perfiles").select("email").in("id", [s.vendedor_id, s.jefe_id].filter(Boolean));
    const copia = (Deno.env.get("CORREO_COPIA") ?? "").split(",").map((e) => e.trim()).filter(Boolean);
    const correo = await enviarCorreo(s, numero, [...(perfiles ?? []).map((p) => p.email), ...copia], simulado);
    return json({ numero_cliente: numero, destinatarios: dests, simulado, correo });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
