import { loadStripe } from '@stripe/stripe-js';

// This will initialize Stripe only ONCE (module scope)
export const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);