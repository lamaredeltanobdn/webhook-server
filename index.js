
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
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const text = await orderRes.text();
    console.log('==> Uber response status:', orderRes.status);
    console.log('==> Uber response:', text);
    res.status(orderRes.status).send(text);

  } catch (err) {
    console.error('==> ERROR in /test-order:', err.message);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});
