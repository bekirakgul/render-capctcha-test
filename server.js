const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Güvenli şekilde environment değişkenlerinden alınıyor
const GEETEST_ID = process.env.GEETEST_ID;
const GEETEST_KEY = process.env.GEETEST_KEY;

// Geetest Register API
const initGeetest = async () => {
  const res = await axios.get("https://gcaptcha4.geetest.com/load", {
    params: {
      gt: GEETEST_ID,
      callback: "geetest_cb", // JSONP callback, ama biz temizleyeceğiz
    },
  });

  const data = res.data.replace(/^geetest_cb\((.*)\)$/, "$1");
  return JSON.parse(data);
};

// Register endpoint (frontend burada başlatıyor)
app.get("/captcha/register", async (req, res) => {
  try {
    const data = await initGeetest();
    res.json(data);
  } catch (error) {
    console.error("Register error:", error.message);
    res.status(500).json({ error: "Captcha register failed" });
  }
});

// Captcha doğrulama endpointi
app.post("/captcha/validate", async (req, res) => {
  const { lot_number, captcha_output, pass_token, gen_time } = req.body;

  try {
    const result = await axios.post(
      "https://gcaptcha4.geetest.com/validate",
      {
        lot_number,
        captcha_output,
        pass_token,
        gen_time,
        captcha_id: GEETEST_ID,
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    if (result.data.result === "success") {
      res.json({ success: true });
    } else {
      res.json({ success: false });
    }
  } catch (error) {
    console.error("Validation error:", error.message);
    res.status(500).json({ error: "Validation failed" });
  }
});

// Render için doğru port ayarı (!!!)
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
