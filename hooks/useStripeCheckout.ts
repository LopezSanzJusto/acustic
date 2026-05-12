// hooks/useStripeCheckout.ts
//
// Hook que orquesta el flujo de pago Stripe desde el cliente:
//   1. Llama a la Cloud Function `createPaymentIntent` con el tourId.
//   2. Inicializa el PaymentSheet con el clientSecret devuelto.
//   3. Lo presenta al usuario.
//
// Tras un pago exitoso NO hace falta escribir nada en Firestore desde aquí:
// el webhook del backend hace el `arrayUnion` en users/{uid}.purchasedTours,
// y `useMyTours` está suscrito al doc del usuario → `hasAccess` se actualiza
// solo y el botón de pago desaparece.
//
// El hook devuelve `startCheckout(tourId)` que se puede llamar desde cualquier
// botón. Maneja errores con Alert y expone `loading` para deshabilitar la UI.

import { useState, useCallback } from "react";
import { Alert } from "react-native";
import { useStripe } from "@stripe/stripe-react-native";
import { callCreatePaymentIntent } from "../services/firebaseFunctions";
import {
  STRIPE_MERCHANT_DISPLAY_NAME,
  isStripeConfigured,
} from "../constants/stripe";

export type CheckoutResult =
  | { status: "succeeded"; paymentIntentId: string }
  | { status: "canceled" }
  | { status: "failed"; message: string };

export function useStripeCheckout() {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);

  const startCheckout = useCallback(
    async (tourId: string): Promise<CheckoutResult> => {
      if (!isStripeConfigured()) {
        Alert.alert(
          "Pagos no configurados",
          "Falta la Publishable Key de Stripe (constants/stripe.ts). " +
            "Configúrala antes de probar el pago real.",
        );
        return { status: "failed", message: "stripe-not-configured" };
      }

      setLoading(true);
      try {
        // 1) Pedir clientSecret al backend.
        const { data } = await callCreatePaymentIntent({ tourId });
        const { clientSecret } = data ?? {};
        if (!clientSecret) {
          throw new Error("Respuesta inválida del servidor (sin clientSecret).");
        }

        // 2) Inicializar el PaymentSheet.
        const initResult = await initPaymentSheet({
          merchantDisplayName: STRIPE_MERCHANT_DISPLAY_NAME,
          paymentIntentClientSecret: clientSecret,
          // allowsDelayedPaymentMethods: true permite SEPA / transferencia.
          // Lo dejamos en false para audioguías porque queremos desbloquear al
          // instante; los métodos asíncronos confirmarían más tarde.
          allowsDelayedPaymentMethods: false,
          returnURL: "acustic://stripe-redirect",
        });
        if (initResult.error) {
          throw new Error(initResult.error.message);
        }

        // 3) Presentar al usuario.
        const presentResult = await presentPaymentSheet();
        if (presentResult.error) {
          // Stripe usa el code "Canceled" cuando el usuario cierra el sheet.
          if (presentResult.error.code === "Canceled") {
            return { status: "canceled" };
          }
          throw new Error(presentResult.error.message);
        }

        // ✅ El pago se ha autorizado. La confirmación REAL llega vía webhook
        // → se actualiza users/{uid}.purchasedTours → useMyTours reacciona.
        return { status: "succeeded", paymentIntentId: data.paymentIntentId };
      } catch (err: any) {
        const message =
          err?.message ?? "No se pudo completar el pago. Inténtalo de nuevo.";
        Alert.alert("Error en el pago", message);
        return { status: "failed", message };
      } finally {
        setLoading(false);
      }
    },
    [initPaymentSheet, presentPaymentSheet],
  );

  return { startCheckout, loading };
}
