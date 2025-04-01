const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const GEETEST_ID = "be57a7d62b12dad80dc9c948f4eeb291";
const GEETEST_KEY = "3cbfe48b2574a3fc4b125e08cb7747f7";

// Geetest library kullanmadan direk request ile çözüm
const initGeetest = async () => {
  // Geetest Register API (v3 için klasik yöntem)
  const res = await axios.get("https://gcaptcha4.geetest.com/load", {
    params: {
      gt: GEETEST_ID,
      callback: "geetest_cb", // callback js için gerekli ama burada ignore edilebilir
    },
  });

  // JSONP cevabı temizleme
  const data = res.data.replace(/^geetest_cb\((.*)\)$/, "$1");
  return JSON.parse(data);
};

app.get("/captcha/register", async (req, res) => {
  try {
    const data = await initGeetest();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Captcha register failed" });
  }
});

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
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (result.data.result === "success") {
      res.json({ success: true });
    } else {
      res.json({ success: false });
    }
  } catch (error) {
    res.status(500).json({ error: "Validation failed" });
  }
});

app.listen(3001, () => {
  console.log("Server listening on port 3001");
});
