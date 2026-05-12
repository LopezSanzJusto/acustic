// services/firebaseFunctions.ts
//
// Wrapper finísimo sobre @react-native-firebase/functions para llamar a las
// Cloud Functions tipadas. La región DEBE coincidir con la del backend
// (functions/src/index.ts → REGION = "europe-west1").

import { getApp } from "@react-native-firebase/app";
import { getFunctions, httpsCallable } from "@react-native-firebase/functions";

const FUNCTIONS_REGION = "europe-west1";

const functions = getFunctions(getApp(), FUNCTIONS_REGION);

export interface CreatePaymentIntentRequest {
  tourId: string;
}

export interface CreatePaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
}

export const callCreatePaymentIntent = httpsCallable<
  CreatePaymentIntentRequest,
  CreatePaymentIntentResponse
>(functions, "createPaymentIntent");
