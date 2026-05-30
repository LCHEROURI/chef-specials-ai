const OPENAI_IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-2";
const OPENAI_IMAGE_QUALITY = process.env.OPENAI_IMAGE_QUALITY || "medium";

function sendJson(response, status, payload) {
  response.setHeader("Content-Type", "application/json");
  response.status(status).json(payload);
}

function userFacingOpenAIError(payload) {
  const message = payload?.error?.message || payload?.message;
  if (!message) return "OpenAI image generation failed.";
  return message;
}

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    sendJson(response, 200, {
      setupNeeded: true,
      message: "OpenAI image generation is ready, but OPENAI_API_KEY is not configured in this Vercel project. Add it to chef-specials-ai for Production, then redeploy."
    });
    return;
  }

  try {
    const { dishName, cuisine, caption, ingredients, plating, prompt, format = "square" } = request.body || {};
    const size = format === "story" ? "1024x1536" : "1024x1024";
    const imagePrompt = [
      "Create a realistic professional restaurant food photograph for a working chef.",
      `Dish: ${dishName}.`,
      `Cuisine style: ${cuisine}.`,
      `Menu caption: ${caption}.`,
      `Visible ingredients: ${(ingredients || []).join(", ")}.`,
      `Plating direction: ${plating}.`,
      prompt,
      "Upscale casual or fine dining presentation, appetizing but practical, no impossible garnish, no text, no watermark, no hands, no utensils covering the food, soft natural side light, shallow depth of field."
    ].filter(Boolean).join(" ");

    const openaiResponse = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: OPENAI_IMAGE_MODEL,
        prompt: imagePrompt,
        size,
        quality: OPENAI_IMAGE_QUALITY
      })
    });

    const payload = await openaiResponse.json().catch(() => ({}));
    if (!openaiResponse.ok) {
      sendJson(response, openaiResponse.status, {
        error: userFacingOpenAIError(payload),
        model: OPENAI_IMAGE_MODEL
      });
      return;
    }

    const image = payload.data?.[0];
    const b64 = image?.b64_json;
    const url = image?.url;
    if (!b64 && !url) {
      sendJson(response, 502, {
        error: "OpenAI returned no image data.",
        model: OPENAI_IMAGE_MODEL
      });
      return;
    }

    sendJson(response, 200, {
      imageUrl: b64 ? `data:image/png;base64,${b64}` : url,
      revisedPrompt: image?.revised_prompt || imagePrompt,
      model: OPENAI_IMAGE_MODEL
    });
  } catch (error) {
    sendJson(response, 500, {
      error: error.message || "Unexpected image generation error.",
      model: OPENAI_IMAGE_MODEL
    });
  }
};
