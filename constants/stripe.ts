// constants/stripe.ts
//
// Configuración pública de Stripe en el cliente.
//
// La Publishable Key es PÚBLICA por diseño: identifica la cuenta de Stripe ante
// el SDK del cliente, no autoriza cobros por sí sola. Aun así no se debe usar
// la *secret* key (sk_...) aquí jamás — esa solo vive en las Cloud Functions.
//
// Cuando tengas la cuenta de Stripe en https://dashboard.stripe.com/test/apikeys
// copia la "Publishable key" (empieza por pk_test_...) y sustituye el placeholder.
// El resto del código del cliente ya está listo, no hay que tocar nada más.

export const STRIPE_PUBLISHABLE_KEY = "pk_test_REEMPLAZAR_CON_TU_CLAVE";

// merchantIdentifier solo lo usa Apple Pay en iOS. Si no lo configuras todavía,
// el PaymentSheet seguirá funcionando con tarjeta normal y Google Pay.
export const STRIPE_MERCHANT_IDENTIFIER = "merchant.com.acustic.app";

// Nombre comercial que aparece en el PaymentSheet ("Pagar a ...").
export const STRIPE_MERCHANT_DISPLAY_NAME = "Acustic";

export function isStripeConfigured(): boolean {
  return (
    typeof STRIPE_PUBLISHABLE_KEY === "string" &&
    STRIPE_PUBLISHABLE_KEY.startsWith("pk_") &&
    !STRIPE_PUBLISHABLE_KEY.includes("REEMPLAZAR")
  );
}
