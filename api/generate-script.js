// Vercel Serverless Function: Multi-Speaker Podcast Script Generator
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

const TOPIC_PRESETS = {
  "ai-india": {
    title: "The Indic AI Revolution: From Labs to 1.4 Billion People",
    tagline: "How Indian AI is breaking language barriers and solving grassroot challenges.",
    dialogues: [
      { speaker: "rohan", name: "Rohan", text: "Namaste everyone! Welcome back to another exciting episode of SarvamCast. Today, we're diving into the phenomenal rise of Indic AI." },
      { speaker: "pooja", name: "Pooja", text: "Namaste Rohan! It's incredible to see how voice models like Sarvam Bulbul and Saaras are transforming how India communicates across twenty-two languages." },
      { speaker: "rohan", name: "Rohan", text: "Exactly, Pooja. Think about farmers getting weather advisories in Kannada, or students learning calculus in Marathi with native speech synthesis." },
      { speaker: "pooja", name: "Pooja", text: "That is the real superpower of generative AI in India—technology that adapts to the people, not the other way around!" },
      { speaker: "rohan", name: "Rohan", text: "Well said! Stay tuned, folks, as we break down what this means for startups, developers, and the next billion digital citizens." }
    ]
  },
  "bengaluru-tech": {
    title: "Bengaluru Hustle: Silk Board Jams to Unicorn Dreams",
    tagline: "The unfiltered story of India's Silicon Valley.",
    dialogues: [
      { speaker: "rohan", name: "Rohan", text: "Welcome to SarvamCast! Today we are talking about India's startup capital: Bengaluru." },
      { speaker: "pooja", name: "Pooja", text: "Where pitch decks are discussed over filter coffee in Koramangala and closed during Silk Board traffic jams!" },
      { speaker: "rohan", name: "Rohan", text: "Haha, totally! But jokes aside, the engineering talent and energy here are on par with Silicon Valley." },
      { speaker: "pooja", name: "Pooja", text: "Absolutely. Especially with deep-tech and hardware startups now sharing the spotlight alongside AI powerhouses." },
      { speaker: "rohan", name: "Rohan", text: "Bengaluru is truly where the future of digital India is being written, one line of code at a time." }
    ]
  },
  "chandrayaan-space": {
    title: "Chandrayaan & Beyond: India's Leap into Deep Space",
    tagline: "Frugal engineering and astronomical ambition at ISRO.",
    dialogues: [
      { speaker: "rohan", name: "Rohan", text: "Welcome listeners! Today's episode is a special tribute to the scientists and engineers at ISRO." },
      { speaker: "pooja", name: "Pooja", text: "Chandrayaan-3 landing on the south pole of the Moon was a defining historic moment for every single Indian." },
      { speaker: "rohan", name: "Rohan", text: "What always fascinates me is the frugal engineering—achieving interplanetary precision on a fraction of Hollywood budgets!" },
      { speaker: "pooja", name: "Pooja", text: "And now with Gaganyaan on the horizon, India is preparing to send astronauts into space on our own rockets." },
      { speaker: "rohan", name: "Rohan", text: "An inspiring journey that proves dedication and ingenuity know no gravitational limits." }
    ]
  },
  "ipl-cricket": {
    title: "IPL, Moneyball & the Data Revolution in Indian Cricket",
    tagline: "How algorithms, biomechanics, and analytics are redefining the game.",
    dialogues: [
      { speaker: "rohan", name: "Rohan", text: "Welcome cricket fans to SarvamCast! Today we look at cricket through the lens of modern tech." },
      { speaker: "pooja", name: "Pooja", text: "Hey Rohan! Cricket isn't just about instincts anymore; it is driven by real-time analytics and predictive modeling." },
      { speaker: "rohan", name: "Rohan", text: "Right! Every bowler's release point and every batsman's wagon wheel are broken down by AI algorithms before the next ball is bowled." },
      { speaker: "pooja", name: "Pooja", text: "It has turned the IPL into an incredible tactical chess match played at 150 kilometers per hour." },
      { speaker: "rohan", name: "Rohan", text: "The thrill of sports combined with cutting-edge tech—you can't ask for better entertainment!" }
    ]
  },
  "indian-street-food": {
    title: "Flavors of Bharat: From Delhi Chaat to Madurai Jigarthanda",
    tagline: "A culinary journey exploring the soul of Indian streets.",
    dialogues: [
      { speaker: "rohan", name: "Rohan", text: "Welcome foodie friends to today's mouth-watering episode of SarvamCast!" },
      { speaker: "pooja", name: "Pooja", text: "Rohan, you are making me hungry already! Indian street food is pure art and culture served on a leaf." },
      { speaker: "rohan", name: "Rohan", text: "From the spicy Pani Puri in Mumbai to steaming hot Idlis in Bengaluru and fragrant Biryanis in Hyderabad." },
      { speaker: "pooja", name: "Pooja", text: "Every state, every city, and practically every street corner has a signature dish with generations of history." },
      { speaker: "rohan", name: "Rohan", text: "So grab a cup of hot chai and join us as we celebrate the culinary tapestry of India!" }
    ]
  }
};

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
      topic = "AI Revolution in India",
      language = "en-IN",
      speaker1 = "rohan",
      speaker2 = "pooja",
      turns = 4,
      presetKey,
      apiKey
    } = body || {};

    if (presetKey && TOPIC_PRESETS[presetKey]) {
      const preset = TOPIC_PRESETS[presetKey];
      const customDialogues = preset.dialogues.map((d, i) => ({
        speaker: i % 2 === 0 ? speaker1 : speaker2,
        name: i % 2 === 0 ? `Host 1 (${speaker1})` : `Host 2 (${speaker2})`,
        text: d.text
      }));
      return sendJson(res, 200, {
        success: true,
        title: preset.title,
        tagline: preset.tagline,
        topic,
        language,
        dialogues: customDialogues
      });
    }

    const key = apiKey || process.env.SARVAM_API_KEY || DEFAULT_KEY;
    let generatedScript = null;

    if (key && topic && !TOPIC_PRESETS[presetKey]) {
      try {
        const prompt = `You are a podcast creator for 'SarvamCast'. Write a 4-turn two-host conversational podcast about '${topic}' in language '${language}'. Host 1: ${speaker1}, Host 2: ${speaker2}. Return JSON: {"title":"...","tagline":"...","dialogues":[{"speaker":"${speaker1}","name":"Host 1","text":"..."},{"speaker":"${speaker2}","name":"Host 2","text":"..."}]}`;

        const llmRes = await fetch("https://api.sarvam.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-subscription-key": key
          },
          body: JSON.stringify({
            model: "sarvam-105b",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 600
          })
        });

        if (llmRes.ok) {
          const llmData = await llmRes.json();
          const content = llmData.choices?.[0]?.message?.content || "";
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            generatedScript = JSON.parse(jsonMatch[0]);
          }
        }
      } catch (err) {
        console.warn("LLM fallback", err.message);
      }
    }

    if (!generatedScript || !generatedScript.dialogues || generatedScript.dialogues.length === 0) {
      const cleanTopic = topic.trim();
      generatedScript = {
        title: `Deep Dive: ${cleanTopic}`,
        tagline: `An exciting conversation exploring ${cleanTopic} from every angle.`,
        dialogues: [
          {
            speaker: speaker1,
            name: `Host 1 (${speaker1})`,
            text: `Namaste and welcome to SarvamCast! Today we have an absolutely thrilling topic: ${cleanTopic}.`
          },
          {
            speaker: speaker2,
            name: `Host 2 (${speaker2})`,
            text: `Hey everyone! I have been looking forward to this all week. ${cleanTopic} is having such a huge impact across India right now.`
          },
          {
            speaker: speaker1,
            name: `Host 1 (${speaker1})`,
            text: `What makes it so interesting is how rapidly things are changing, with innovators and communities pushing new boundaries.`
          },
          {
            speaker: speaker2,
            name: `Host 2 (${speaker2})`,
            text: `Completely agree! The momentum behind ${cleanTopic} is undeniable, and the opportunities ahead are limitless.`
          },
          {
            speaker: speaker1,
            name: `Host 1 (${speaker1})`,
            text: `Thank you for tuning in to SarvamCast. Don't forget to share your thoughts, and stay curious until next time!`
          }
        ]
      };
    }

    return sendJson(res, 200, {
      success: true,
      ...generatedScript,
      topic,
      language
    });
  } catch (error) {
    console.error("Script generation error:", error);
    return sendJson(res, 500, {
      error: "Failed to generate podcast script",
      message: error.message
    });
  }
}
