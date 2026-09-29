const assert = require("node:assert");
const handler = require("./api/generate-image.js");

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

runApiTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
