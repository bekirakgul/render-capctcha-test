require('dotenv').config();
const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

const GEETEST_ID = process.env.GEETEST_ID;
const GEETEST_KEY = process.env.GEETEST_KEY;

app.use(cors());
app.use(bodyParser.json());

// Ana dizin için basit bir yanıt
app.get('/', (req, res) => {
  res.send('Geetest Captcha Backend çalışıyor!');
});

// Geetest Register API'si için endpoint
app.get('/captcha/register', async (req, res) => {
  try {
    const response = await axios.get('https://gcaptcha4.geetest.com/load', {
      params: {
        gt: GEETEST_ID,
        callback: 'geetest_cb',
      },
    });

    const data = JSON.parse(response.data.replace(/^geetest_cb\((.*)\)$/, '$1'));
    res.json(data);
  } catch (error) {
    console.error('Register error:', error.message);
    res.status(500).json({ error: 'Captcha register failed' });
  }
});

// Geetest doğrulama için endpoint
app.post('/captcha/validate', async (req, res) => {
  const { lot_number, captcha_output, pass_token, gen_time } = req.body;

  // sign_token oluşturulması
  const sign_token = crypto
    .createHmac('sha256', GEETEST_KEY)
    .update(lot_number)
    .digest('hex');

  try {
    const response = await axios.post('https://gcaptcha4.geetest.com/validate', {
      lot_number,
      captcha_output,
      pass_token,
      gen_time,
      captcha_id: GEETEST_ID,
      sign_token,
    });

    const { result } = response.data;
    if (result === 'success') {
      res.json({ success: true });
    } else {
      res.json({ success: false });
    }
  } catch (error) {
    console.error('Validation error:', error.message);
    res.status(500).json({ error: 'Validation failed' });
  }
});

app.use(cors());

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
