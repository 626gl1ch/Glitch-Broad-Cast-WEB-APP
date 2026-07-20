const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { requireAuth, supabase } = require('../middleware/auth');

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || 'sk_test_replace_me';

// Initialize a Paystack transaction
router.post('/checkout', requireAuth, async (req, res) => {
  const { email } = req.user;
  const amount = 1000 * 100; // $10 or NGN equivalent depending on Paystack currency setup. Default is local.
  // Assuming USD for standard processing, amount must be in cents. Paystack usually processes in kobo or cents.
  // For safety, let's pass USD if supported by the merchant.
  
  try {
    const params = {
      email,
      amount: amount,
      currency: "USD",
      metadata: {
        user_id: req.user.id
      }
    };

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });

    const data = await response.json();
    if (!data.status) {
      throw new Error(data.message || 'Paystack initialization failed');
    }

    res.json({
      authorization_url: data.data.authorization_url,
      reference: data.data.reference
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Paystack Webhook
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const hash = crypto.createHmac('sha512', PAYSTACK_SECRET_KEY).update(JSON.stringify(req.body)).digest('hex');
    if (hash !== req.headers['x-paystack-signature']) {
      return res.status(401).send('Invalid signature');
    }

    const event = req.body;
    if (event.event === 'charge.success') {
      const { metadata, reference, amount } = event.data;
      const user_id = metadata.user_id;

      if (user_id) {
        // Upgrade Profile
        await supabase
          .from('profiles')
          .update({ subscription_status: 'active' })
          .eq('id', user_id);

        // Record Subscription
        const expires_at = new Date();
        expires_at.setMonth(expires_at.getMonth() + 1); // 1 month

        await supabase
          .from('subscriptions')
          .insert({
            user_id,
            plan_type: 'monthly',
            amount: amount / 100, // convert back from cents
            currency: 'USD',
            provider: 'paystack',
            reference,
            status: 'active',
            expires_at: expires_at.toISOString()
          });
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Webhook Error:', error.message);
    res.sendStatus(500);
  }
});

module.exports = router;
