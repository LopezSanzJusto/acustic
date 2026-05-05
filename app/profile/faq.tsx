// app/profile/faq.tsx — Preguntas frecuentes (acordeón en una sola pantalla)

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../utils/theme';

interface FAQ { q: string; a: string; }

const FAQS: FAQ[] = [
  // BLOQUE 1 · Lo esencial
  {
    q: '¿Qué es Acustic?',
    a: 'Acustic convierte la ciudad en una experiencia sonora inmersiva: historias geolocalizadas que se activan en el lugar exacto, se viven a tu ritmo y pueden compartirse en tiempo real con otras personas.',
  },
  {
    q: '¿Tengo que seguir una ruta exacta?',
    a: 'No necesariamente. Puedes seguir la ruta sugerida, moverte con libertad o incluso personalizar la ruta eligiendo qué sitios ver y en qué posición de la ruta. Acustic se adapta a ti, no al revés.',
  },
  {
    q: '¿Funciona sin internet?',
    a: 'Sí. Descargas la audioguía una vez comprada y la escuchas offline. Ideal para viajar sin datos.',
  },
  {
    q: '¿El audio se reproduce automáticamente?',
    a: 'Tienes la opción de personalizarlo en tu perfil; pinchando sobre ‘Notificaciones y permisos’ y activando la opción ‘Reproducción automática cerca de un punto de interés’. Si lo haces, cuando llegues a un punto clave, el audio se activará solo. Sin tocar el móvil.',
  },

  // BLOQUE 2 · Precio y acceso
  {
    q: '¿Pago por la app o por las audioguías?',
    a: 'La app es gratuita. Pagas solo por las audioguías que quieras escuchar.',
  },
  {
    q: '¿Es una suscripción?',
    a: 'No. Compras una audioguía y es tuya para siempre. Sin cuotas ni renovaciones ocultas.',
  },
  {
    q: '¿La audioguía es para siempre?',
    a: 'Sí. Acceso ilimitado una vez comprada, pudiendo escucharla todas las veces que quieras.',
  },
  {
    q: '¿Cuánto dura una audioguía?',
    a: 'Depende de la ciudad y la ruta. Siempre indicamos duración estimada antes de comprar, además antes de comprarla puedes ver una previsualización de la ruta con todos las paradas y sus tiempos.',
  },

  // BLOQUE 3 · Técnica, confianza y soporte
  {
    q: '¿Consume mucha batería o datos?',
    a: 'No. El audio offline y la geolocalización están optimizados para rutas largas.',
  },
  {
    q: '¿Qué pasa si pierdo el GPS?',
    a: 'El audio no se corta. Simplemente no se activan nuevos puntos hasta recuperar señal.',
  },
  {
    q: '¿Puedo probar antes de pagar?',
    a: 'Sí. Incluimos fragmentos gratuitos para que sepas lo que compras. Normalmente los 3 o 4 primeros audios de una ruta.',
  },
  {
    q: '¿Qué pasa si no me gusta la audioguía?',
    a: 'Nos rompería el corazoncito pero es algo que entendemos que podría pasar. Desde nuestro equipo de experiencia de usuario te pediríamos que nos contactes contándonos el problema y dejando una reseña con los puntos que mejorarías para poder mejorar la experiencia de lxs siguientes viajerxs. Gracias :)',
  },
  {
    q: '¿Hay soporte si tengo problemas durante la ruta?',
    a: 'Al estar empezando contamos con un equipo reducido y no podremos estar las 24h pero, por favor, ante cualquier problema, escríbenos en el apartado ‘Contáctanos’ en la pantalla de tu perfil e intentaremos solucionar tu incidencia lo antes posible. Gracias por la comprensión.',
  },
];

const BORDER = '#D0CFFE';

export default function FAQScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => setOpenIndex(prev => (prev === i ? null : i));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Preguntas frecuentes</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Lista */}
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}
      >
        {FAQS.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <View key={i} style={[styles.pill, isOpen && styles.pillOpen]}>
              <TouchableOpacity
                style={styles.pillHeader}
                activeOpacity={0.7}
                onPress={() => toggle(i)}
              >
                <Text style={[styles.question, isOpen && styles.questionOpen]}>{item.q}</Text>
                <Ionicons
                  name={isOpen ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={COLORS.primary}
                />
              </TouchableOpacity>

              {isOpen && (
                <Text style={styles.answer}>{item.a}</Text>
              )}
            </View>
          );
        })}
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

  scroll: { paddingHorizontal: 18, paddingTop: 8 },

  // Píldora
  pill: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#8874F7',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 0,
  },
  pillOpen: {
    borderColor: '#8874F7',
    paddingBottom: 16,
  },
  pillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 24,
  },
  question: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '700',
    marginRight: 10,
  },
  questionOpen: {
    color: '#7678ED',
  },
  answer: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 20,
    marginTop: 10,
  },
});
