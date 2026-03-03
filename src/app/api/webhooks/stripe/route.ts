import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { getAdminClient } from '@/lib/supabase/admin';
import { 
  sendPaymentSuccessEmail, 
  sendPaymentFailedEmail,
  sendCancellationEmail,
} from '@/lib/email';

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-12-15.clover',
  });
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    console.error('Missing stripe-signature header');
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const stripe = getStripe();
  const supabase = getAdminClient();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  console.log(`📥 Stripe webhook: ${event.type}`);

  try {
    switch (event.type) {
      // ============================================
      // CHECKOUT COMPLETED
      // ============================================
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.metadata?.customer_id;
        const plan = session.metadata?.plan || 'starter';

        console.log(`✅ Checkout completed for ${customerId}, plan: ${plan}`);

        if (customerId && session.subscription) {
          // Update customer record
          const { error } = await supabase
            .from('customers')
            .update({
              stripe_customer_id: session.customer as string,
              subscription_id: session.subscription as string,
              plan: plan,
              trial_ends_at: null, // No longer on trial
            })
            .eq('id', customerId);

          if (error) {
            console.error('Failed to update customer:', error);
          } else {
            console.log(`✅ Customer ${customerId} updated to plan: ${plan}`);
          }
        }
        break;
      }

      // ============================================
      // SUBSCRIPTION UPDATED
      // ============================================
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.metadata?.customer_id;

        if (customerId) {
          let plan = subscription.metadata?.plan || 'starter';
          
          // Handle status changes
          if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
            plan = 'cancelled';
          } else if (subscription.status === 'trialing') {
            plan = 'trial';
          }

          // Note: current_period_end field removed due to Stripe API changes
          await supabase
            .from('customers')
            .update({
              plan,
            })
            .eq('id', customerId);

          console.log(`✅ Subscription updated for ${customerId}: ${plan}`);
        }
        break;
      }

      // ============================================
      // SUBSCRIPTION DELETED
      // ============================================
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.metadata?.customer_id;

        if (customerId) {
          // Get customer email before updating
          const { data: cancelledCustomer } = await supabase
            .from('customers')
            .select('email')
            .eq('id', customerId)
            .single();

          await supabase
            .from('customers')
            .update({
              plan: 'cancelled',
              subscription_id: null,
            })
            .eq('id', customerId);

          console.log(`✅ Subscription cancelled for ${customerId}`);

          // Send cancellation email
          if (cancelledCustomer) {
            await sendCancellationEmail(cancelledCustomer.email);
          }

          // TODO: Pause customer's server
        }
        break;
      }

      // ============================================
      // INVOICE PAID
      // ============================================
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const amount = invoice.amount_paid / 100;
        console.log(`✅ Invoice paid: ${invoice.id} - $${amount.toFixed(2)}`);

        // Send payment confirmation email
        const { data: paidCustomers } = await supabase
          .from('customers')
          .select('email, plan')
          .eq('stripe_customer_id', invoice.customer as string);

        if (paidCustomers && paidCustomers.length > 0) {
          await sendPaymentSuccessEmail(
            paidCustomers[0].email, 
            `$${amount.toFixed(2)}`,
            paidCustomers[0].plan || 'starter'
          );
        }
        break;
      }

      // ============================================
      // INVOICE PAYMENT FAILED
      // ============================================
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`❌ Payment failed: ${invoice.id}`);

        // Get customer and send email
        const { data: failedCustomers } = await supabase
          .from('customers')
          .select('id, email')
          .eq('stripe_customer_id', invoice.customer as string);

        if (failedCustomers && failedCustomers.length > 0) {
          await sendPaymentFailedEmail(failedCustomers[0].email);
          console.log(`Payment failed email sent to: ${failedCustomers[0].email}`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
