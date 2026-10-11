// Vercel Serverless Function: Synthesize Speech using Sarvam Bulbul TTS
const DEFAULT_KEY = "sk_qaq8ho3m_ifhyEjbCvcWMUv8RgzKzk1qn";

function sendJson(res, statusCode, data) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,POST");
  res.setHeader("Content-Type", "application/json");
  if (typeof res.status === "function" && typeof res.json === "function") {
    return res.status(statusCode).json(data);
  }
  res.statusCode = statusCode;
  return res.end(JSON.stringify(data));
}

async function getBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body); } catch (e) { return {}; }
  }
  return new Promise((resolve) => {
    let bodyData = "";
    req.on("data", chunk => { bodyData += chunk; });
    req.on("end", () => {
      try { resolve(JSON.parse(bodyData)); } catch (e) { resolve({}); }
    });
  });
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,POST");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, api-subscription-key"
  );

  if (req.method === "OPTIONS") {
    res.statusCode = 200;
    return res.end();
  }

  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method not allowed. Use POST." });
  }

  try {
    const body = await getBody(req);
    const {
      text,
      speaker = "rohan",
      target_language_code = "en-IN",
      model = "bulbul:v3",
      pace = 1.0,
      apiKey
    } = body || {};

    if (!text || typeof text !== "string" || !text.trim()) {
      return sendJson(res, 400, { error: "Missing required field: text" });
    }

    const key = apiKey || process.env.SARVAM_API_KEY || DEFAULT_KEY;
    if (!key) {
      return sendJson(res, 401, { error: "Missing Sarvam API Key" });
    }

    // Call Sarvam AI TTS Endpoint
    const payload = {
      inputs: [text.trim()],
      target_language_code: target_language_code || "en-IN",
      speaker: speaker || "rohan",
      model: model || "bulbul:v3",
      pace: Number(pace) || 1.0
    };

    const sarvamRes = await fetch("https://api.sarvam.ai/text-to-speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": key
      },
      body: JSON.stringify(payload)
    });

    const data = await sarvamRes.json();

    if (!sarvamRes.ok) {
      console.error("Sarvam TTS error:", data);
      return sendJson(res, sarvamRes.status, {
        error: data.error?.message || "Sarvam TTS generation failed",
        details: data
      });
    }

    const audioBase64 = data.audios && data.audios[0] ? data.audios[0] : null;

    if (!audioBase64) {
      return sendJson(res, 500, { error: "No audio data received from Sarvam TTS" });
    }

    return sendJson(res, 200, {
      success: true,
      speaker,
      target_language_code,
      audio_base64: audioBase64,
      mime_type: "audio/wav"
    });
  } catch (error) {
    console.error("Synthesize error:", error);
    return sendJson(res, 500, {
      error: "Internal server error during speech synthesis",
      message: error.message
    });
  }
}
