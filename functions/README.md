# Cloud Functions — Pagos Stripe

Backend mínimo para cobrar audioguías. Dos funciones:

- `createPaymentIntent` (callable) — la app la invoca para iniciar la compra.
- `stripeWebhook` (HTTPS) — Stripe la llama cuando el pago se confirma.

## Pasos manuales (los hace el usuario, una sola vez)

### 1. Cuenta de Stripe (gratis, modo test)

1. Entrar en https://dashboard.stripe.com/register y registrarse.
2. **No hace falta verificar la cuenta todavía** para desarrollo: en modo *test* Stripe funciona sin IBAN ni KYC. Eso sí, los pagos reales no se pueden cobrar hasta verificar.
3. En el dashboard, arriba a la derecha, asegurarse de estar en **Test mode** (interruptor "View test data").
4. Copiar las dos claves desde https://dashboard.stripe.com/test/apikeys:
   - **Publishable key** — empieza por `pk_test_...` (va al cliente RN, sin secreto).
   - **Secret key** — empieza por `sk_test_...` (solo backend, NUNCA en el cliente ni en git).

### 2. Plan Blaze en Firebase

Las Cloud Functions necesitan plan **Blaze** (pago por uso) para hacer llamadas salientes a Stripe. El free tier de Blaze cubre de sobra el desarrollo.

- https://console.firebase.google.com/project/_/usage/details → "Modify plan" → Blaze.

### 3. Inicializar Firebase CLI

```bash
npm install -g firebase-tools
firebase login
```

Editar `.firebaserc` en la raíz del repo y poner el `projectId` real (donde pone `TU_PROJECT_ID_AQUI`).

### 4. Instalar dependencias

```bash
cd functions
npm install
```

### 5. Guardar las claves como secretos de Firebase

```bash
firebase functions:secrets:set STRIPE_SECRET_KEY
# pegar la sk_test_... cuando lo pida

firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
# de momento poner cualquier valor temporal, se actualiza en el paso 7
```

### 6. Compilar y desplegar

```bash
cd functions
npm run build
firebase deploy --only functions
```

Tras el deploy, Firebase imprime dos URLs:
- `createPaymentIntent` (callable, se invoca desde el SDK)
- `stripeWebhook` — algo tipo `https://europe-west1-TU_PROJECT.cloudfunctions.net/stripeWebhook`

### 7. Configurar el webhook en Stripe

1. https://dashboard.stripe.com/test/webhooks → **Add endpoint**.
2. URL: la del `stripeWebhook` desplegado.
3. Eventos: `payment_intent.succeeded` y `payment_intent.payment_failed`.
4. Tras crearlo, Stripe muestra el **Signing secret** (`whsec_...`). Copiarlo.
5. Actualizar el secreto en Firebase:

```bash
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
# pegar el whsec_... real
firebase deploy --only functions:stripeWebhook
```

### 8. Probar en local con el emulador (opcional pero recomendado)

```bash
cd functions
npm run serve
```

Y usar la **Stripe CLI** para reenviar webhooks de test al emulador:

```bash
stripe listen --forward-to http://localhost:5001/TU_PROJECT/europe-west1/stripeWebhook
stripe trigger payment_intent.succeeded
```

## Lo que viene después (todavía no hecho)

- En la app: instalar `@stripe/stripe-react-native`, montar `StripeProvider` con la `pk_test_...`, y crear un hook `useStripeCheckout(tourId)` que invoque `createPaymentIntent` y abra el `PaymentSheet`.
- Reglas de Firestore: bloquear que el cliente escriba directamente en `users/{uid}.purchasedTours` (ahora mismo `usePurchaseTour.ts` lo hace sin pasar por Stripe — eso hay que quitarlo cuando se conecte el flujo real).
- Pantalla de "compra exitosa" tras cerrar el PaymentSheet.
