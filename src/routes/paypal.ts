// src/routes/paypal.ts
import express from 'express';
import { getAccessToken, createOrder, captureOrder } from '../lib/paypalClient.js';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
dotenv.config();

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// create-order
router.post('/create-order', express.json(), async (req, res) => {
  console.log('Create order request body1:', req.body);
  try {
    const { amount = '10.00', userEmail } = req.body;
    const token = await getAccessToken();
    const order = await createOrder(token, amount);
    // store mapping order.id -> email (optional table 'payments_temp')
    await supabase.from('payments_temp').insert([{ order_id: order.id, email: userEmail, amount }]);
    res.json(order);
    console.log('Order created with ID:', order);
  } catch (err: any) {
    console.error('Create order error:', err);
    res.status(500).json({ error: err.message });
  }
});

// capture-order (optional)
router.post('/capture-order', express.json(), async (req, res) => {
  console.log('Capture order request body2:', req.body);
  try {
    const { orderId } = req.body;
    const token = await getAccessToken();
    const capture = await captureOrder(token, orderId);
    res.json(capture);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// webhook - note: PayPal expects raw body for signature verification in production.
// For local sandbox demo we parse body json, but production must verify signature using PayPal API.
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  console.log('Webhook received');
  try {
    const bodyText = req.body.toString();
    const body = JSON.parse(bodyText);
    console.log('Webhook event_type', body.event_type);

    if (body.event_type === 'PAYMENT.CAPTURE.COMPLETED' || body.event_type === 'CHECKOUT.ORDER.APPROVED') {
      // PayPal shape varies. Try to get payer email
      const payerEmail = body.resource?.payer?.email_address || body.resource?.payer?.email;
      // find payment mapping in payments_temp table by order id if necessary
      const orderId = body.resource?.supplementary_data?.related_ids?.order_id || body.resource?.invoice_id || body.resource?.id || body.resource?.order_id;

      if (payerEmail) {
        // update your profiles table or a users table
        const { error } = await supabase
          .from('profiles') // adapt to your table name
          .insert([{email:payerEmail, isPaid: true }])
        if (error) console.error('Supabase update error', error);
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('Webhook error', err);
    res.status(500).send('error');
  }
});

export default router;
