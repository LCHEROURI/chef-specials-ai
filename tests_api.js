const assert = require("node:assert");
const handler = require("./api/generate-image.js");
const specialsHandler = require("./api/generate-specials.js");

function createMockReq(options = {}) {
  return {
    method: options.method || "POST",
    headers: options.headers || { "content-type": "application/json" },
    body: options.body || {}
  };
}

function createMockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    setHeader(key, val) {
      this.headers[key] = val;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
    end() {
      return this;
    }
  };
  return res;
}

async function runApiTests() {
  console.log("=== STARTING API/GENERATE-IMAGE UNIT TESTS ===");

  // 1. Test OPTIONS Preflight
  console.log("Testing OPTIONS preflight...");
  const optReq = createMockReq({ method: "OPTIONS" });
  const optRes = createMockRes();
  await handler(optReq, optRes);
  assert.strictEqual(optRes.statusCode, 200);
  assert.strictEqual(optRes.headers["Access-Control-Allow-Origin"], "*");
  console.log("✓ OPTIONS preflight handled with correct CORS headers.");

  // 2. Test GET method rejection
  console.log("Testing non-POST method rejection...");
  const getReq = createMockReq({ method: "GET" });
  const getRes = createMockRes();
  await handler(getReq, getRes);
  assert.strictEqual(getRes.statusCode, 405);
  console.log("✓ Non-POST rejected with 405 Method Not Allowed.");

  // 3. Test Missing Prompt
  console.log("Testing missing prompt rejection...");
  const emptyReq = createMockReq({ method: "POST", body: {} });
  const emptyRes = createMockRes();
  await handler(emptyReq, emptyRes);
  assert.strictEqual(emptyRes.statusCode, 400);
  assert(emptyRes.body.error.includes("required"));
  console.log("✓ Missing prompt rejected with 400.");

  // 4. Test Stringified JSON parsing & missing API key configuration response
  console.log("Testing stringified JSON body parsing...");
  const stringifiedReq = createMockReq({
    method: "POST",
    body: JSON.stringify({ prompt: "A plated branzino dish" })
  });
  const stringifiedRes = createMockRes();
  // Without OPENAI_API_KEY set, it should return setupNeeded: true
  await handler(stringifiedReq, stringifiedRes);
  assert.strictEqual(stringifiedRes.statusCode, 200);
  assert.strictEqual(stringifiedRes.body.setupNeeded, true);
  console.log("✓ Stringified body safely parsed and unconfigured API key gracefully handled.");

  // 5. Test OpenAI payload sanitizer with mock fetch
  console.log("Testing OpenAI payload sanitization for DALL-E-3 vs GPT Image...");
  const originalFetch = global.fetch;
  let capturedPayload = null;
  global.fetch = async (url, options) => {
    capturedPayload = JSON.parse(options.body);
    return {
      ok: true,
      json: async () => ({
        data: [{ url: "https://example.com/test-dish.png" }]
      })
    };
  };

  try {
    process.env.OPENAI_API_KEY = "sk-test-mock-key";

    // Test DALL-E-3 incompatible size and quality
    const dalle3Req = createMockReq({
      method: "POST",
      body: {
        prompt: "Steak frites",
        model: "dall-e-3",
        size: "1024x1536", // Invalid for DALL-E 3
        quality: "medium"   // Invalid for DALL-E 3
      }
    });
    const dalle3Res = createMockRes();
    await handler(dalle3Req, dalle3Res);
    assert.strictEqual(dalle3Res.statusCode, 200);
    assert.strictEqual(capturedPayload.model, "dall-e-3");
    assert.strictEqual(capturedPayload.size, "1024x1792", "dall-e-3 size should normalize to 1024x1792");
    assert.strictEqual(capturedPayload.quality, "standard", "dall-e-3 quality should normalize to standard");
    assert.strictEqual(capturedPayload.response_format, "b64_json", "DALL-E 3 defaults to b64_json for non-expiring images");
    console.log("✓ DALL-E 3 size and quality properly sanitized to valid OpenAI values.");

    // Test GPT-Image-2 accepts 1024x1536 and medium
    const gptImgReq = createMockReq({
      method: "POST",
      body: {
        prompt: "Duck confit ravioles",
        model: "gpt-image-2",
        size: "1024x1536",
        quality: "medium"
      }
    });
    const gptImgRes = createMockRes();
    await handler(gptImgReq, gptImgRes);
    assert.strictEqual(gptImgRes.statusCode, 200);
    assert.strictEqual(capturedPayload.model, "gpt-image-2");
    assert.strictEqual(capturedPayload.size, "1024x1536");
    assert.strictEqual(capturedPayload.quality, "medium");
    assert.strictEqual(capturedPayload.output_format, "png");
    console.log("✓ GPT-Image-2 preserves next-gen image parameters.");

    // Test Base64 response format mapping
    const b64Req = createMockReq({
      method: "POST",
      body: {
        prompt: "Lobster pasta",
        model: "dall-e-3",
        response_format: "b64_json"
      }
    });
    const b64Res = createMockRes();
    await handler(b64Req, b64Res);
    assert.strictEqual(capturedPayload.response_format, "b64_json");
    console.log("✓ DALL-E 3 preserves b64_json response format.");
  } finally {
    global.fetch = originalFetch;
    delete process.env.OPENAI_API_KEY;
  }

  console.log("=== ALL API UNIT TESTS PASSED (100%) ===");
}

async function runSpecialsApiTests() {
  console.log("\n=== STARTING API/GENERATE-SPECIALS UNIT TESTS ===");

  // 1. Test OPTIONS Preflight
  console.log("Testing OPTIONS preflight...");
  const optReq = createMockReq({ method: "OPTIONS" });
  const optRes = createMockRes();
  await specialsHandler(optReq, optRes);
  assert.strictEqual(optRes.statusCode, 200);
  assert.strictEqual(optRes.headers["Access-Control-Allow-Origin"], "*");
  console.log("✓ OPTIONS preflight handled with correct CORS headers.");

  // 2. Test GET method rejection
  console.log("Testing non-POST method rejection...");
  const getReq = createMockReq({ method: "GET" });
  const getRes = createMockRes();
  await specialsHandler(getReq, getRes);
  assert.strictEqual(getRes.statusCode, 405);
  console.log("✓ Non-POST rejected with 405 Method Not Allowed.");

  // 3. Test missing OpenRouter key returns setupNeeded (defaults applied, no crash)
  console.log("Testing unconfigured OpenRouter key handling...");
  delete process.env.OPENROUTER_API_KEY;
  const noKeyReq = createMockReq({ method: "POST", body: {} });
  const noKeyRes = createMockRes();
  await specialsHandler(noKeyReq, noKeyRes);
  assert.strictEqual(noKeyRes.statusCode, 200);
  assert.strictEqual(noKeyRes.body.setupNeeded, true);
  assert(noKeyRes.body.message.includes("OPENROUTER_API_KEY"));
  console.log("✓ Missing OPENROUTER_API_KEY gracefully returns setupNeeded.");

  // 4. Test stringified JSON body parsing reaches the same setup path
  console.log("Testing stringified JSON body parsing...");
  const stringifiedReq = createMockReq({
    method: "POST",
    body: JSON.stringify({ cuisine: "Italian", brief: "Two pasta specials", count: 2 })
  });
  const stringifiedRes = createMockRes();
  await specialsHandler(stringifiedReq, stringifiedRes);
  assert.strictEqual(stringifiedRes.statusCode, 200);
  assert.strictEqual(stringifiedRes.body.setupNeeded, true);
  console.log("✓ Stringified body safely parsed.");

  // 5-8. Mocked OpenRouter behaviour
  const originalFetch = global.fetch;
  let capturedUrl = null;
  let capturedOptions = null;
  const mockSpecialsPayload = (specials) => ({
    ok: true,
    json: async () => ({
      choices: [{ message: { content: JSON.stringify({ specials }) } }]
    })
  });

  try {
    process.env.OPENROUTER_API_KEY = "sk-or-test-mock-key";

    // 5. Successful generation: response parsed and normalized to the UI shape
    console.log("Testing successful OpenRouter generation and shape normalization...");
    global.fetch = async (url, options) => {
      capturedUrl = url;
      capturedOptions = options;
      return mockSpecialsPayload([
        {
          name: "Charred Octopus with Nduja Butter",
          caption: "Charred octopus over crispy potatoes with nduja butter and salsa verde.",
          ingredients: ["Octopus", "Yukon potatoes", "Nduja", "Parsley", "Lemon", "Olive oil"],
          cost: 13.4,
          price: 42,
          overview: "Braise octopus ahead, char to order, and finish with warm nduja butter.",
          why: "Premium seafood special with make-ahead prep and a strong margin.",
          pairing: "Etna Bianco, or a bitter citrus spritz."
        },
        {
          name: "Wild Mushroom Tagliatelle",
          caption: "Hand-cut tagliatelle with roasted mushrooms and Taleggio fonduta.",
          ingredients: "Tagliatelle, Cremini mushrooms, Taleggio, Thyme, Butter",
          cost: "6.25",
          overview: "Roast mushrooms in batches and toss pasta to order in the fonduta.",
          why: "Low food cost vegetarian option that still reads luxurious.",
          pairing: "Barbera, or a dry Lambrusco."
        }
      ]);
    };
    const okReq = createMockReq({
      method: "POST",
      body: { cuisine: "Italian", brief: "One seafood, one vegetarian pasta", count: 2 }
    });
    const okRes = createMockRes();
    await specialsHandler(okReq, okRes);
    assert.strictEqual(okRes.statusCode, 200);
    assert.strictEqual(okRes.body.source, "openrouter");
    assert.strictEqual(okRes.body.model, "openai/gpt-6-luna");
    assert.strictEqual(okRes.body.specials.length, 2);
    const [first, second] = okRes.body.specials;
    assert.strictEqual(first.name, "Charred Octopus with Nduja Butter");
    assert.strictEqual(first.cost, 13.4);
    assert.strictEqual(first.price, 42);
    assert(Array.isArray(first.ingredients) && first.ingredients.length === 6);
    // String numbers and comma-string ingredients are coerced; missing price is derived
    assert.strictEqual(second.cost, 6.25);
    assert(Array.isArray(second.ingredients) && second.ingredients.length === 5);
    assert(Number.isFinite(second.price) && second.price > second.cost);
    // Upstream request shape: OpenRouter chat completions with JSON mode + server key
    assert.strictEqual(capturedUrl, "https://openrouter.ai/api/v1/chat/completions");
    assert.strictEqual(capturedOptions.headers.Authorization, "Bearer sk-or-test-mock-key");
    const sentPayload = JSON.parse(capturedOptions.body);
    assert.strictEqual(sentPayload.model, "openai/gpt-6-luna");
    assert.strictEqual(sentPayload.response_format.type, "json_object");
    assert(sentPayload.messages[1].content.includes("Create 2 original Italian dinner specials"));
    console.log("✓ OpenRouter response parsed into the exact UI special shape.");

    // 6. Count is clamped to the server maximum and defaults when unparsable
    console.log("Testing count clamping and defaults...");
    global.fetch = async (url, options) => {
      capturedOptions = options;
      return mockSpecialsPayload([
        { name: "Solo Special", caption: "One dish.", ingredients: ["Eggplant"], cost: 5, price: 18, overview: "Roast.", why: "Margin.", pairing: "Soave." }
      ]);
    };
    const clampReq = createMockReq({ method: "POST", body: { cuisine: "Greek", count: 99 } });
    const clampRes = createMockRes();
    await specialsHandler(clampReq, clampRes);
    assert.strictEqual(clampRes.statusCode, 200);
    assert(JSON.parse(capturedOptions.body).messages[1].content.includes("Create 5 original Greek"));
    const defaultReq = createMockReq({ method: "POST", body: { cuisine: "Greek", count: "many" } });
    const defaultRes = createMockRes();
    await specialsHandler(defaultReq, defaultRes);
    assert.strictEqual(defaultRes.statusCode, 200);
    assert(JSON.parse(capturedOptions.body).messages[1].content.includes("Create 3 original Greek"));
    console.log("✓ Count clamped to 5 and defaulted to 3.");

    // 7. Upstream HTTP failure returns a clean 502 without leaking upstream detail
    console.log("Testing upstream failure handling...");
    global.fetch = async () => ({
      ok: false,
      status: 500,
      json: async () => ({ error: { message: "secret upstream detail" } })
    });
    const failReq = createMockReq({ method: "POST", body: { cuisine: "French", count: 3 } });
    const failRes = createMockRes();
    await specialsHandler(failReq, failRes);
    assert.strictEqual(failRes.statusCode, 502);
    assert(failRes.body.error);
    assert(!JSON.stringify(failRes.body).includes("secret upstream detail"));
    console.log("✓ Upstream failure returns clean 502 with no upstream payload leak.");

    // 8. Unparseable model output and network failure both return 502
    console.log("Testing unparseable output and network failure handling...");
    global.fetch = async () => ({
      ok: true,
      json: async () => ({ choices: [{ message: { content: "not json at all" } }] })
    });
    const badReq = createMockReq({ method: "POST", body: { cuisine: "Chinese", count: 3 } });
    const badRes = createMockRes();
    await specialsHandler(badReq, badRes);
    assert.strictEqual(badRes.statusCode, 502);
    global.fetch = async () => { throw new Error("socket hang up"); };
    const netReq = createMockReq({ method: "POST", body: { cuisine: "Chinese", count: 3 } });
    const netRes = createMockRes();
    await specialsHandler(netReq, netRes);
    assert.strictEqual(netRes.statusCode, 502);
    console.log("✓ Unparseable output and network errors return 502 (client falls back to templates).");
  } finally {
    global.fetch = originalFetch;
    delete process.env.OPENROUTER_API_KEY;
  }

  console.log("=== ALL API/GENERATE-SPECIALS UNIT TESTS PASSED (100%) ===");
}

runApiTests()
  .then(runSpecialsApiTests)
  .catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
  });
