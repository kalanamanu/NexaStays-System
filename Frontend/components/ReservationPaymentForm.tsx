import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

// Initialize Stripe once at the module level
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

type ReservationPaymentFormProps = {
  clientSecret: string;
  onSuccess: () => void;
};

function CheckoutForm({
  clientSecret,
  onSuccess,
}: {
  clientSecret: string;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setErrorMessage(null);

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setLoading(false);
      setErrorMessage("Card element not found.");
      return;
    }

    const { error, paymentIntent } = await stripe.confirmCardPayment(
      clientSecret,
      {
        payment_method: { card: cardElement },
      }
    );

    setLoading(false);

    if (error) {
      setErrorMessage(error.message || "Payment failed");
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      onSuccess();
    } else {
      setErrorMessage("Payment did not complete.");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement
        options={{
          style: {
            base: {
              fontSize: "16px",
              color: "#fff",
              "::placeholder": { color: "#aab7c4" },
            },
            invalid: { color: "#fa755a" },
          },
        }}
      />
      <button
        type="submit"
        disabled={!stripe || loading}
        style={{
          marginTop: "16px",
          padding: "8px 24px",
          background: "#7c3aed",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          fontWeight: "bold",
          cursor: loading ? "wait" : "pointer",
        }}
      >
        {loading ? "Processing..." : "Pay"}
      </button>
      {errorMessage && (
        <div style={{ color: "red", marginTop: 8 }}>{errorMessage}</div>
      )}
    </form>
  );
}

export default function ReservationPaymentForm({
  clientSecret,
  onSuccess,
}: ReservationPaymentFormProps) {
  // Prevent rendering if required data is missing
  if (!clientSecret || !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    return <div>Stripe is not configured properly.</div>;
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutForm clientSecret={clientSecret} onSuccess={onSuccess} />
    </Elements>
  );
}
