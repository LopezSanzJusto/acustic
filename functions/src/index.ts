// functions/src/index.ts
//
// Cloud Functions para pagos de audioguías con Stripe.
//
// - createPaymentIntent (callable v2): el cliente lo invoca para iniciar la compra
//   de un tour. La función NUNCA confía en el precio enviado por el cliente: lee
//   el precio real desde Firestore (colección "tours") y crea el PaymentIntent
//   con ese importe. Devuelve clientSecret + paymentIntentId para que la app
//   abra el PaymentSheet de Stripe.
//
// - stripeWebhook (https onRequest v2): endpoint público al que Stripe llama
//   cuando un PaymentIntent cambia de estado. Verifica la firma HMAC con el
//   webhook secret, y al recibir "payment_intent.succeeded" añade el tourId
//   al array users/{uid}.purchasedTours.
//
// El acceso real al contenido se decide leyendo ese array (ya lo hace
// useMyTours/usePurchaseTour en la app). Mientras no exista la compra
// confirmada por Stripe, hasAccess será false y el botón de pago seguirá
// visible.

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { logger } from "firebase-functions/v2";
import * as admin from "firebase-admin";
import Stripe from "stripe";

admin.initializeApp();
const db = admin.firestore();

// Secretos gestionados por Firebase (firebase functions:secrets:set ...).
// NO meter las claves en código ni en .env del repo.
const STRIPE_SECRET_KEY = defineSecret("STRIPE_SECRET_KEY");
const STRIPE_WEBHOOK_SECRET = defineSecret("STRIPE_WEBHOOK_SECRET");

// Región europea por latencia y por estar el usuario en España.
const REGION = "europe-west1";

// Moneda por defecto. Si en el futuro algún tour tiene currency distinta,
// se podrá leer del propio doc del tour.
const DEFAULT_CURRENCY = "eur";

function getStripeClient(): Stripe {
  return new Stripe(STRIPE_SECRET_KEY.value(), {
    apiVersion: "2024-12-18.acacia",
    typescript: true,
  });
}

/**
 * createPaymentIntent
 * --------------------
 * Llamada desde la app con: { tourId: string }
 * Devuelve: { clientSecret, paymentIntentId, amount, currency, publishableKeyHint }
 *
 * Reglas críticas:
 *  - El usuario debe estar autenticado.
 *  - El precio se lee del documento tours/{tourId} (server-side), nunca del cliente.
 *  - Si el tour es gratuito (price <= 0) se rechaza: no hay nada que cobrar.
 *  - Si el usuario ya lo tiene en purchasedTours, se rechaza para evitar doble cobro.
 */
export const createPaymentIntent = onCall(
  {
    region: REGION,
    secrets: [STRIPE_SECRET_KEY],
    // CORS por defecto cerrado a clientes oficiales; Firebase SDK añade el token de auth.
  },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError("unauthenticated", "Debes iniciar sesión para comprar.");
    }

    const tourId = (request.data?.tourId ?? "").toString().trim();
    if (!tourId) {
      throw new HttpsError("invalid-argument", "Falta tourId.");
    }

    // 1) Leer el tour desde Firestore para obtener el precio real.
    const tourSnap = await db.collection("tours").doc(tourId).get();
    if (!tourSnap.exists) {
      throw new HttpsError("not-found", "El tour no existe.");
    }
    const tour = tourSnap.data() as { price?: number; title?: string; currency?: string };

    const priceEuros = Number(tour.price ?? 0);
    if (!Number.isFinite(priceEuros) || priceEuros <= 0) {
      throw new HttpsError(
        "failed-precondition",
        "Este tour es gratuito, no requiere pago.",
      );
    }

    // Stripe trabaja en céntimos (smallest currency unit).
    const amount = Math.round(priceEuros * 100);
    const currency = (tour.currency ?? DEFAULT_CURRENCY).toLowerCase();

    // 2) Evitar doble compra.
    const userSnap = await db.collection("users").doc(uid).get();
    const purchased: string[] = userSnap.exists
      ? (userSnap.data()?.purchasedTours ?? [])
      : [];
    if (purchased.includes(tourId)) {
      throw new HttpsError("already-exists", "Ya tienes este tour.");
    }

    // 3) Crear el PaymentIntent.
    const stripe = getStripeClient();
    try {
      const intent = await stripe.paymentIntents.create({
        amount,
        currency,
        // El webhook usará estos campos para saber qué desbloquear y a quién.
        metadata: {
          uid,
          tourId,
          tourTitle: tour.title ?? "",
        },
        automatic_payment_methods: { enabled: true },
        description: `Acustic — ${tour.title ?? tourId}`,
      });

      logger.info("PaymentIntent creado", {
        uid,
        tourId,
        amount,
        currency,
        paymentIntentId: intent.id,
      });

      return {
        clientSecret: intent.client_secret,
        paymentIntentId: intent.id,
        amount,
        currency,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      logger.error("Stripe createPaymentIntent falló", { uid, tourId, message });
      throw new HttpsError("internal", "No se pudo iniciar el pago.");
    }
  },
);

/**
 * stripeWebhook
 * -------------
 * Endpoint HTTPS público. Stripe envía aquí los eventos.
 * Debe verificar la firma con STRIPE_WEBHOOK_SECRET antes de hacer NADA.
 *
 * Importante: necesita el body RAW (no parseado a JSON) para validar la firma.
 * En Cloud Functions v2 el body crudo está disponible en `request.rawBody`.
 */
export const stripeWebhook = onRequest(
  {
    region: REGION,
    secrets: [STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET],
    // Stripe necesita poder llamar a esta URL sin autenticación de Firebase.
    invoker: "public",
  },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    const signature = req.headers["stripe-signature"];
    if (!signature || typeof signature !== "string") {
      res.status(400).send("Falta cabecera stripe-signature");
      return;
    }

    const stripe = getStripeClient();
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        signature,
        STRIPE_WEBHOOK_SECRET.value(),
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "firma inválida";
      logger.warn("Webhook con firma inválida", { message });
      res.status(400).send(`Webhook Error: ${message}`);
      return;
    }

    try {
      switch (event.type) {
        case "payment_intent.succeeded": {
          const intent = event.data.object as Stripe.PaymentIntent;
          const uid = intent.metadata?.uid;
          const tourId = intent.metadata?.tourId;

          if (!uid || !tourId) {
            logger.error("PaymentIntent sin metadata uid/tourId", {
              paymentIntentId: intent.id,
            });
            break;
          }

          // Idempotencia: guardamos el evento por paymentIntentId para evitar
          // duplicados si Stripe reintenta el webhook.
          const purchaseRef = db
            .collection("users")
            .doc(uid)
            .collection("purchases")
            .doc(intent.id);

          const alreadyProcessed = (await purchaseRef.get()).exists;
          if (alreadyProcessed) {
            logger.info("Evento ya procesado, ignorando", { paymentIntentId: intent.id });
            break;
          }

          const batch = db.batch();
          batch.set(purchaseRef, {
            tourId,
            paymentIntentId: intent.id,
            amount: intent.amount,
            currency: intent.currency,
            status: intent.status,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          batch.update(db.collection("users").doc(uid), {
            purchasedTours: admin.firestore.FieldValue.arrayUnion(tourId),
          });
          await batch.commit();

          logger.info("Compra confirmada", { uid, tourId, paymentIntentId: intent.id });
          break;
        }

        case "payment_intent.payment_failed": {
          const intent = event.data.object as Stripe.PaymentIntent;
          logger.warn("Pago fallido", {
            paymentIntentId: intent.id,
            uid: intent.metadata?.uid,
            tourId: intent.metadata?.tourId,
            lastError: intent.last_payment_error?.message,
          });
          break;
        }

        default:
          // Ignoramos el resto de eventos.
          logger.debug("Evento Stripe ignorado", { type: event.type });
          break;
      }

      res.status(200).json({ received: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      logger.error("Error procesando webhook", { message });
      res.status(500).send("Error interno");
    }
  },
);
