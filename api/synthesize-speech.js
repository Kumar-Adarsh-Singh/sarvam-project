// Vercel Serverless Function: Synthesize Speech using Sarvam Bulbul TTS
const DEFAULT_KEY = "sk_qaq8ho3m_ifhyEjbCvcWMUv8RgzKzk1qn";

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,POST");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, api-subscription-key"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const {
      text,
      speaker = "rohan",
      target_language_code = "en-IN",
      model = "bulbul:v3",
      pace = 1.0,
      apiKey
    } = req.body || {};

    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "Missing required field: text" });
    }

    const key = apiKey || process.env.SARVAM_API_KEY || DEFAULT_KEY;
    if (!key) {
      return res.status(401).json({ error: "Missing Sarvam API Key" });
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
      return res.status(sarvamRes.status).json({
        error: data.error?.message || "Sarvam TTS generation failed",
        details: data
      });
    }

    const audioBase64 = data.audios && data.audios[0] ? data.audios[0] : null;

    if (!audioBase64) {
      return res.status(500).json({ error: "No audio data received from Sarvam TTS" });
    }

    return res.status(200).json({
      success: true,
      speaker,
      target_language_code,
      audio_base64: audioBase64,
      mime_type: "audio/wav"
    });
  } catch (error) {
    console.error("Synthesize error:", error);
    return res.status(500).json({
      error: "Internal server error during speech synthesis",
      message: error.message
    });
  }
}
