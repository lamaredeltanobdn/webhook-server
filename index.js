const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

app.get('/', (req, res) => {
  res.send('La Mare del Tano — Webhook Server activo');
});

app.post('/webhook', async (req, res) => {
  try {
    const event = req.body;
    console.log('Evento recibido:', JSON.stringify(event));

    if (event.event_type === 'orders.notification') {
      const order = event.meta;
      const { error } = await supabase
        .from('pedidos_ubereats')
        .insert([{
          order_id: order.order_id,
          store_id: order.store_id,
          status: 'nuevo',
          raw_data: event,
          created_at: new Date().toISOString()
        }]);

      if (error) console.error('Error Supabase:', error);
    }

    res.status(200).json({ status: 'ok' });
  } catch (err) {
    console.error('Error webhook:', err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor activo en puerto ${PORT}`);
});
