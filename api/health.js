// Vercel Serverless Function: Health Check & System Status
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

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.statusCode = 200;
    return res.end();
  }

  const hasKey = Boolean(process.env.SARVAM_API_KEY || DEFAULT_KEY);
  return sendJson(res, 200, {
    status: "ok",
    service: "SarvamCast - AI Indic Podcast Generator",
    idea: "#17 from Sarvam Idea Library",
    sarvam_key_configured: hasKey,
    supported_models: ["bulbul:v3", "bulbul:v4-flash", "sarvam-105b"],
    supported_languages: [
      { code: "en-IN", name: "Indian English" },
      { code: "hi-IN", name: "Hindi" },
      { code: "ta-IN", name: "Tamil" },
      { code: "te-IN", name: "Telugu" },
      { code: "kn-IN", name: "Kannada" },
      { code: "mr-IN", name: "Marathi" },
      { code: "bn-IN", name: "Bengali" },
      { code: "gu-IN", name: "Gujarati" }
    ],
    timestamp: new Date().toISOString()
  });
}
