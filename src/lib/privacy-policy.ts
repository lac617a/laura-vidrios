import { formatWhatsappNumber } from "@/lib/whatsapp";

/**
 * Texto base de la política de tratamiento de datos (Ley 1581 de 2012 y Decreto 1377 de 2013) para
 * cuando la dueña aún no escribió la suya en la configuración. Describe lo que de verdad hace el
 * sitio. Debe revisarlo un asesor antes del lanzamiento (ROADMAP S10).
 */
export function defaultPrivacyPolicy(settings: {
  businessName: string;
  whatsappNumber: string;
  address: string | null;
}): string {
  const contact = settings.whatsappNumber
    ? `por WhatsApp al ${formatWhatsappNumber(settings.whatsappNumber)}`
    : "por los canales de contacto de este sitio";
  const domicile = settings.address ? `, con domicilio en ${settings.address},` : "";

  return `## Responsable del tratamiento
${settings.businessName}${domicile} es responsable del tratamiento de los datos personales que recibe a través de este sitio web y de WhatsApp. Puedes contactarnos ${contact}.

## Qué datos tratamos
- En este sitio web no pedimos tu nombre ni tu número, y no usamos cookies de publicidad. Medimos las visitas de forma anónima, sin cookies.
- Cuando consultas un espejo, registramos el código de la consulta, el producto, la medida, los servicios que pediste y la ciudad que escribiste.
- Si nos escribes por WhatsApp, recibimos tu número, tu nombre de perfil y lo que compartas en el chat, por ejemplo la dirección de entrega o fotos del espacio.

## Para qué los usamos
- Responder tus consultas y enviarte cotizaciones.
- Coordinar la fabricación, el envío y la instalación de tu pedido.
- Hacer seguimiento a tu consulta y mejorar nuestro servicio.

No vendemos tus datos. Solo los compartimos con quien hace el envío o la instalación de tu pedido, cuando es necesario.

## Tus derechos
Como titular de los datos puedes, en cualquier momento:
- Conocer, actualizar y rectificar tus datos.
- Pedir prueba de la autorización que nos diste.
- Saber qué uso les hemos dado.
- Revocar la autorización o pedir que los eliminemos, cuando no exista un deber legal o contractual de conservarlos.
- Presentar quejas ante la Superintendencia de Industria y Comercio (SIC).

## Cómo ejercerlos
Escríbenos ${contact} con tu solicitud. Respondemos las consultas en un máximo de 10 días hábiles y los reclamos en un máximo de 15 días hábiles, como indica la ley.

## Autorización
Al escribirnos y compartir tus datos, autorizas su tratamiento para las finalidades de esta política.

## Vigencia
Esta política rige desde su publicación. La actualizaremos si cambia la forma en que tratamos los datos.`;
}
