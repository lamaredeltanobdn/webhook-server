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

app.get('/test-webhook', async (req, res) => {
  console.log('==> /test-webhook called');
  try {
    const fakeOrder = {
      event_type: 'orders.notification',
      meta: {
        order_id: 'TEST-' + Date.now(),
        store_id: process.env.UBER_STORE_UUID
      }
    };

    const { data, error } = await supabase.from('pedidos_ubereats').insert([{
      order_id: fakeOrder.meta.order_id,
      store_id: fakeOrder.meta.store_id,
      status: 'nuevo',
      raw_data: fakeOrder,
      created_at: new Date().toISOString()
    }]);
    if (error) {
      console.error('==> Supabase error:', error.message);
      return res.status(500).json({ error: error.message });
    }

    console.log('==> Orden guardada en Supabase OK');
    res.json({ status: 'ok', order_id: fakeOrder.meta.order_id, data });

  } catch (err) {
    console.error('==> ERROR:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/webhook', async (req, res) => {
  try {
    const event = req.body;
    console.log('Evento rebut:', JSON.stringify(event));

    if (event.event_type === 'orders.notification') {
      const order = event.meta;
      await supabase.from('pedidos_ubereats').insert([{
        order_id: order.order_id,
        store_id: order.store_id,
        status: 'nuevo',
        raw_data: event,
        created_at: new Date().toISOString()
      }]);
    }

    res.status(200).json({ status: 'ok' });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor actiu al port ${PORT}`));
