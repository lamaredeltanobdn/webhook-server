const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

app.get('/', (req, res) => {
  res.send('La Mare del Tano — Webhook Server actiu');
});

app.get('/test-token', async (req, res) => {
  try {
    const params = new URLSearchParams();
    params.append('client_id', process.env.UBER_CLIENT_ID);
    params.append('client_secret', process.env.UBER_CLIENT_SECRET);
    params.append('grant_type', 'client_credentials');
    params.append('scope', 'eats.order eats.store eats.store.orders.read eats.store.status.write');

    const response = await fetch('https://sandbox-login.uber.com/oauth/v2/token', {
      method: 'POST',
      body: params
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/test-order', async (req, res) => {
  console.log('==> /test-order called');
  try {
    const params = new URLSearchParams();
    params.append('client_id', process.env.UBER_CLIENT_ID);
    params.append('client_secret', process.env.UBER_CLIENT_SECRET);
    params.append('grant_type', 'client_credentials');
    params.append('scope', 'eats.order eats.store eats.store.orders.read eats.store.status.write');

    console.log('==> Getting token...');
    const tokenRes = await fetch('https://sandbox-login.uber.com/oauth/v2/token', {
      method: 'POST',
      body: params
    });
    const tokenData = await tokenRes.json();
    console.log('==> Token status:', tokenRes.status);

    if (!tokenData.access_token) {
      return res.status(500).json({ error: 'No access_token', details: tokenData });
    }

    const { access_token } = tokenData;

    console.log('==> Calling Uber orders API...');
    const orderRes = await fetch(
      `https://api.uber.com/v1/eats/store/${process.env.UBER_STORE_UUID}/orders`,
      {
        headers: {
          'Authorization': `Bearer ${access_token}
