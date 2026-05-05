// app/profile/privacy.tsx
// Todo en una sola pantalla: lista + panel expandible morado inline.

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../utils/theme';

type Section = 'privacy' | 'terms' | null;

const POLICY = `POLÍTICA DE PRIVACIDAD

1. INFORMACIÓN AL USUARIO

ACUSTIC, como Responsable del Tratamiento, le informa que, según lo dispuesto en el Reglamento (UE) 2016/679, de 27 de abril, (RGPD) y en la L.O. 3/2018, de 5 de diciembre, de protección de datos y garantía de los derechos digitales (LOPDGDD), trataremos su datos tal y como reflejamos en la presente Política de Privacidad.

En esta Política de Privacidad describimos cómo recogemos sus datos personales y por qué los recogemos, qué hacemos con ellos, con quién los compartimos, cómo los protegemos y sus opciones en cuanto al tratamiento de sus datos personales.

Esta Política se aplica al tratamiento de sus datos personales recogidos por la empresa para la prestación de sus servicios. Si acepta las medidas de esta Política, acepta que tratemos sus datos personales como se define en esta Política.

2. CONTACTO

Denominación social: ACUSTIC
Nombre comercial: ACUSTIC
CIF: 12428430N
Domicilio: Calle Vinos de Rueda 2, 3B
e-mail: hola@acustic.com

3. PRINCIPIOS CLAVE

Siempre hemos estado comprometidos con prestar nuestros servicios con el más alto grado de calidad, lo que incluye tratar sus datos con seguridad y transparencia. Nuestros principios son:

- Legalidad: Solo recopilaremos sus Datos personales para fines específicos, explícitos y legítimos.
- Minimización de datos: Limitamos la recogida de datos de carácter personal a lo que es estrictamente relevante y necesario para los fines para los que se han recopilado.
- Limitación de la Finalidad: Solo recogeremos sus datos personales para los fines declarados y solo según sus deseos.
- Precisión: Mantendremos sus datos personales exactos y actualizados.
- Seguridad de los Datos: Aplicamos las medidas técnicas y organizativas adecuadas y proporcionales a los riesgos para garantizar que sus datos no sufran daños.
- Acceso y Rectificación: Disponemos de medios para que acceda o rectifique sus datos cuando lo considere oportuno.
- Conservación: Conservamos sus datos personales de manera legal y apropiada y solo mientras es necesario para los fines para los que se han recopilado.
- Las transferencias internacionales: cuando se dé el caso de que sus datos vayan a ser transferidos fuera de la UE/EEE se protegerán adecuadamente.
- Terceros: El acceso y transferencia de datos personales a terceros se llevan a cabo de acuerdo con las leyes y reglamentos aplicables y con las garantías contractuales adecuadas.
- Marketing Directo y cookies: Cumplimos con la legislación aplicable en materia de publicidad y cookies.

4. RECOGIDA Y TRATAMIENTO DE SUS DATOS PERSONALES

Las tipos de datos que se pueden solicitar y tratar son: Datos de carácter identificativo.

También recogemos de forma automática datos sobre su visita a nuestro sitio web según se describe en la política de cookies.

En general, recogemos y tratamos sus datos personales con el propósito de:

- Proporcionar información, servicios, productos, información relevante y novedades en el sector.
- Envío de comunicaciones.

5. LEGITIMIDAD

De acuerdo con la normativa de protección de datos aplicable, sus datos personales podrán tratarse siempre que:

- Nos ha dado su consentimiento a los efectos del tratamiento.
- Por requerimiento legal.
- Por existir un interés legítimo que no se vea menoscabado por sus derechos de privacidad.
- Por ser necesaria la prestación de alguno de nuestros servicios mediante relación contractual entre usted y nosotros.

6. COMUNICACIÓN DE DATOS PERSONALES

Los datos pueden ser comunicados a empresas relacionadas con ACUSTIC para la prestación de los diversos servicios en calidad de Encargados del Tratamiento. La empresa no realizará ninguna cesión, salvo por obligación legal.

7. SUS DERECHOS

En relación con la recogida y tratamiento de sus datos personales, puede ponerse en contacto con nosotros en cualquier momento para acceder, rectificar, suprimir, limitar, portar u oponerse al tratamiento de sus datos personales.

Puede ejercer estos derechos enviando comunicación a hola@acustic.com.

También tiene derecho a presentar una reclamación ante la Autoridad de control competente (www.aepd.es) si considera que el tratamiento no se ajusta a la normativa vigente.

8. INFORMACIÓN LEGAL

Los requisitos de esta Política complementan, y no reemplazan, cualquier otro requisito existente bajo la ley de protección de datos aplicable.

Esta Política está sujeta a revisiones periódicas y la empresa puede modificarla en cualquier momento. Cuando esto ocurra, le avisaremos de cualquier cambio y le pediremos que confirme su aceptación.`;

const TERMS = `GENERALIDADES

ACUSTIC gestiona este sitio web. En todo el sitio, los términos "nosotros", "nos" y "nuestro" se refieren en lo sucesivo a ACUSTIC. ACUSTIC ofrece esta página web, incluida toda la información, las herramientas y los servicios que se ponen en este sitio a disposición suya, el usuario, siempre y cuando acepte la totalidad de los términos, condiciones, políticas y avisos contemplados aquí.

Al visitar nuestro sitio y/o comprarnos algo, usted interactúa con nuestro "Servicio" y reconoce como vinculantes los siguientes términos y condiciones.

SECCIÓN 1: TÉRMINOS DE LA TIENDA ONLINE

Al aceptar los presentes Términos del servicio, usted declara que tiene la mayoría de edad en su estado o provincia de residencia.

No puede utilizar nuestros productos para ningún fin ilegal o no autorizado ni puede, al hacer uso del Servicio, infringir las leyes de su jurisdicción.

El incumplimiento o violación de cualquiera de los Términos dará como resultado la rescisión inmediata de sus Servicios.

SECCIÓN 2: CONDICIONES GENERALES

Nos reservamos el derecho de rechazar el servicio a cualquier persona, por cualquier motivo, en cualquier momento.

Usted acepta no reproducir, duplicar, copiar, vender, revender ni aprovechar ninguna parte del Servicio sin nuestro permiso expreso por escrito.

SECCIÓN 3: EXACTITUD, TOTALIDAD Y CRONOLOGÍA DE LA INFORMACIÓN

No nos responsabilizamos si la información disponible en este sitio no es precisa, completa o actualizada. El material presentado en este sitio se proporciona solo para información general.

SECCIÓN 4: MODIFICACIONES AL SERVICIO Y PRECIOS

Los precios de nuestros productos están sujetos a cambios sin previo aviso.

Nos reservamos el derecho de modificar o discontinuar el Servicio sin previo aviso en cualquier momento.

SECCIÓN 5: PRODUCTOS O SERVICIOS

Ciertos productos o servicios pueden estar disponibles exclusivamente online a través del sitio web.

No garantizamos que la calidad de cualquier producto, servicio, información u otro material que usted haya comprado u obtenido cumplirá con sus expectativas.

SECCIÓN 6: EXACTITUD DE LA FACTURACIÓN Y DE LA INFORMACIÓN DE LA CUENTA

Nos reservamos el derecho de rechazar cualquier pedido que realice en nuestra tienda. Usted acepta suministrar información completa y precisa de la compra y cuenta actual.

SECCIÓN 7: HERRAMIENTAS OPCIONALES

Podemos proporcionarle acceso a herramientas de terceros que no supervisamos. Cualquier uso que haga de las herramientas opcionales es por su cuenta y riesgo.

SECCIÓN 8: ENLACES DE TERCEROS

No somos responsables de ningún daño o perjuicio relacionado con la compra o el uso de bienes, servicios, recursos, contenido o cualquier otra transacción realizada en conexión con sitios web de terceros.

SECCIÓN 9: COMENTARIOS DE LOS USUARIOS

Si usted envía ideas creativas, sugerencias, propuestas o planes, ya sea online, por correo electrónico o de otro modo, usted acepta que podemos, en cualquier momento, sin restricción: editar, copiar, publicar, distribuir, traducir y usar en cualquier medio cualquier comentario que usted nos envíe.

SECCIÓN 10: INFORMACIÓN PERSONAL

El envío de la información personal que haga a través de la app se rige por nuestra Política de privacidad.

SECCIÓN 11: ERRORES, INEXACTITUDES Y OMISIONES

Nos reservamos el derecho de corregir cualquier error, inexactitud u omisión y de cambiar o actualizar información sin previo aviso.

SECCIÓN 12: USOS PROHIBIDOS

Se le prohíbe utilizar el sitio o su contenido para cualquier propósito ilegal; para infringir cualquier reglamento, norma o ley; acosar, abusar, insultar o discriminar por cualquier motivo; enviar información falsa o engañosa; cargar o transmitir virus o cualquier otro tipo de código dañino.

SECCIÓN 13: DESCARGO DE RESPONSABILIDAD

No garantizamos que el uso que haga de nuestro servicio será sin interrupciones, oportuno, seguro o sin errores. El servicio se ofrece "tal como está" y "según disponibilidad" para su uso, sin ninguna representación, garantía o condición de ningún tipo.

SECCIÓN 14: INDEMNIZACIÓN

Usted acepta indemnizar, defender y mantener indemne a ACUSTIC y a nuestra empresa matriz, subsidiarias, afiliadas, asociados, funcionarios, directores, agentes, contratistas, licenciantes, proveedores de servicios, subcontratistas, proveedores, pasantes y empleados, de cualquier reclamo o demanda, incluidos los honorarios razonables de abogados.

SECCIÓN 15: DIVISIBILIDAD

En caso de que se determine que alguna disposición de los presentes Términos del servicio sea inaplicable, la parte inaplicable se considerará separada sin afectar la validez de las demás disposiciones.

SECCIÓN 16: RESCISIÓN

Estos Términos del servicio se encuentran vigentes a menos que usted o nosotros los rescindamos.

SECCIÓN 17: ACUERDO COMPLETO

Estos Términos de servicio constituyen el acuerdo y el entendimiento completo entre usted y nosotros, y rigen su uso del Servicio.

SECCIÓN 18: LEY APLICABLE

Los presentes Términos del servicio se regirán e interpretarán de acuerdo con las leyes de España.

SECCIÓN 19: CAMBIOS EN LOS TÉRMINOS DEL SERVICIO

Nos reservamos el derecho de actualizar, cambiar o sustituir cualquier parte de los presentes Términos del servicio. Es su responsabilidad consultar esta página periódicamente para ver los cambios.

SECCIÓN 20: INFORMACIÓN DE CONTACTO

Las preguntas sobre los Términos del servicio se deben enviar a support@acustic.com`;

const CARD_BG = '#4A4BA6';

export default function PrivacyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState<Section>(null);

  const toggle = (section: Section) =>
    setOpen(prev => (prev === section ? null : section));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header — siempre visible */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacidad y términos de uso</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Cuerpo desplazable */}
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Ítem: Política de privacidad ── */}
        <TouchableOpacity
          style={styles.item}
          activeOpacity={0.75}
          onPress={() => toggle('privacy')}
        >
          <View style={styles.iconBox}>
            <Text style={styles.iconEmoji}>🔐</Text>
          </View>
          <Text style={styles.itemText}>Política de privacidad</Text>
          <Ionicons
            name={open === 'privacy' ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={COLORS.muted}
          />
        </TouchableOpacity>

        {open === 'privacy' && (
          <View style={styles.card}>
            <View style={styles.handle} />
            <Text style={styles.cardTitle}>Política de privacidad</Text>
            <Text style={styles.cardBody}>{POLICY}</Text>
          </View>
        )}

        {/* ── Ítem: Términos y condiciones ── */}
        <TouchableOpacity
          style={[styles.item, styles.itemBorderTop]}
          activeOpacity={0.75}
          onPress={() => toggle('terms')}
        >
          <View style={styles.iconBox}>
            <Text style={styles.iconEmoji}>📋</Text>
          </View>
          <Text style={styles.itemText}>Términos y condiciones</Text>
          <Ionicons
            name={open === 'terms' ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={COLORS.muted}
          />
        </TouchableOpacity>

        {open === 'terms' && (
          <View style={styles.card}>
            <View style={styles.handle} />
            <Text style={styles.cardTitle}>Términos y condiciones de uso</Text>
            <Text style={styles.cardBody}>{TERMS}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 12,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: {
    flex: 1, textAlign: 'center', fontSize: 18,
    fontWeight: '700', color: '#4E4FA5',
  },

  scroll: { paddingHorizontal: 16, paddingTop: 16 },

  // Ítems de la lista
  item: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 16, paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 0.8, borderColor: COLORS.border,
    marginBottom: 2,
  },
  itemBorderTop: { marginTop: 8 },
  iconBox: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#F4F3FF',
    justifyContent: 'center', alignItems: 'center',
    marginRight: 14,
  },
  iconEmoji: { fontSize: 22 },
  itemText: { flex: 1, fontSize: 16, color: COLORS.text },

  // Panel morado expandible
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
    marginTop: 4,
    marginBottom: 4,
  },
  handle: {
    alignSelf: 'center', width: 40, height: 4,
    borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.4)',
    marginBottom: 16,
  },
  cardTitle: {
    color: '#FFFFFF', fontSize: 17, fontWeight: '700',
    textAlign: 'center', marginBottom: 16,
  },
  cardBody: {
    color: '#FFFFFF', fontSize: 13, lineHeight: 21,
  },
});
