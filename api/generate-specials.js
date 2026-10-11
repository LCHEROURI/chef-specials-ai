const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const KNOWN_CUISINES = ["Greek", "French", "American", "Chinese", "Italian"];
const DEFAULT_CUISINE = "Greek";
const DEFAULT_BRIEF = "Give me upscale dinner specials for tonight.";
const DEFAULT_COUNT = 3;
const MAX_COUNT = 5;

const SYSTEM_PROMPT = [
  "You are an executive chef and menu consultant for upscale casual and fine-dining restaurants.",
  "You compose original dinner specials that a real kitchen line can execute during service: practical prep, clear menu language, realistic food costs, and menu prices that hold roughly a 30 percent food-cost percentage.",
  "Respond with JSON only, in exactly this shape:",
  '{"specials":[{"name":"...","caption":"...","ingredients":["..."],"cost":12.50,"price":39,"overview":"...","why":"...","pairing":"..."}]}',
  "Field rules: name is a polished menu title; caption is one appetizing menu sentence;",
  "ingredients lists 6 to 8 key ingredients as plain names; cost is the realistic food cost per plate in USD as a number;",
  "price is the menu price in USD as a whole-dollar number, about 3 to 3.5 times the cost;",
  "overview is one sentence of practical prep and service direction for the kitchen;",
  "why is one sentence on why the dish works tonight (margin, seasonality, or speed);",
  "pairing is one short beverage pairing suggestion."
].join(" ");

function sendJson(response, status, payload) {
  response.setHeader("Content-Type", "application/json");
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.status(status).json(payload);
}

function clampCount(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return DEFAULT_COUNT;
  return Math.min(MAX_COUNT, Math.max(1, parsed));
}

function cleanText(value, fallback, maxLength) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim().slice(0, maxLength);
  return trimmed || fallback;
}

function normalizeIngredients(value) {
  const list = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(",")
      : [];
  return list
    .map((item) => String(item).trim())
    .filter(Boolean)
    .slice(0, 10);
}

function normalizeSpecial(raw) {
  if (!raw || typeof raw !== "object") return null;

  const name = cleanText(raw.name, "", 140);
  if (!name) return null;

  let cost = Number(raw.cost);
  let price = Number(raw.price);
  if (!Number.isFinite(cost) || cost <= 0) {
    if (!Number.isFinite(price) || price <= 0) return null;
    cost = Math.round((price / 3.35) * 100) / 100;
  }
  if (!Number.isFinite(price) || price <= 0) {
    price = Math.max(1, Math.round(cost * 3.35));
  }

  return {
    name,
    caption: cleanText(raw.caption, "", 400),
    ingredients: normalizeIngredients(raw.ingredients),
    cost: Math.round(cost * 100) / 100,
    price: Math.round(price * 100) / 100,
    overview: cleanText(raw.overview, "", 400),
    why: cleanText(raw.why, "", 400),
    pairing: cleanText(raw.pairing, "", 200)
  };
}

function parseSpecials(content) {
  if (typeof content !== "string") return [];
  const cleaned = content.replace(/```(?:json)?/gi, "").trim();
  const parsed = JSON.parse(cleaned);
  const list = Array.isArray(parsed) ? parsed : parsed?.specials;
  if (!Array.isArray(list)) return [];
  return list.map(normalizeSpecial).filter(Boolean);
}

module.exports = async function handler(request, response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (request.method === "OPTIONS") {
    response.status(200).end();
    return;
  }

  if (request.method !== "POST") {
    response.setHeader("Allow", "POST, OPTIONS");
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }

  try {
    let body = request.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch (err) {
        body = {};
      }
    }
    const input = body && typeof body === "object" ? body : {};

    const cuisineInput = cleanText(input.cuisine, DEFAULT_CUISINE, 60);
    const cuisine = KNOWN_CUISINES.includes(cuisineInput) ? cuisineInput : DEFAULT_CUISINE;
    const brief = cleanText(input.brief, DEFAULT_BRIEF, 500);
    const count = clampCount(input.count);

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      sendJson(response, 200, {
        setupNeeded: true,
        message: "AI specials generation is ready, but the OpenRouter key is not configured in this Vercel project. Add OPENROUTER_API_KEY to chef-specials-ai for Production, then redeploy."
      });
      return;
    }

    let openRouterResponse;
    try {
      openRouterResponse = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://chef-specials-ai.vercel.app",
          "X-Title": "Chef Specials AI"
        },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          response_format: { type: "json_object" },
          temperature: 0.8,
          max_tokens: 1600,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: `Create ${count} original ${cuisine} dinner specials for tonight. Chef's brief: "${brief}". Keep every dish executable in a working kitchen during service, with no repeated proteins across the set.`
            }
          ]
        })
      });
    } catch (err) {
      sendJson(response, 502, {
        error: "OpenRouter could not be reached to generate specials.",
        model: OPENROUTER_MODEL
      });
      return;
    }

    const payload = await openRouterResponse.json().catch(() => ({}));
    if (!openRouterResponse.ok) {
      sendJson(response, 502, {
        error: "OpenRouter could not generate specials right now.",
        model: OPENROUTER_MODEL
      });
      return;
    }

    let specials = [];
    try {
      specials = parseSpecials(payload.choices?.[0]?.message?.content);
    } catch (err) {
      specials = [];
    }
    if (!specials.length) {
      sendJson(response, 502, {
        error: "OpenRouter returned specials in an unexpected format.",
        model: OPENROUTER_MODEL
      });
      return;
    }

    sendJson(response, 200, {
      specials: specials.slice(0, count),
      model: OPENROUTER_MODEL,
      source: "openrouter"
    });
  } catch (error) {
    sendJson(response, 500, {
      error: error.message || "Unexpected specials generation error.",
      model: OPENROUTER_MODEL
    });
  }
};
