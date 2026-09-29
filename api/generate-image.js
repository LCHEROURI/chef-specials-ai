const OPENAI_IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-2";
const OPENAI_IMAGE_QUALITY = process.env.OPENAI_IMAGE_QUALITY || "medium";

function sendJson(response, status, payload) {
  response.setHeader("Content-Type", "application/json");
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.status(status).json(payload);
}

function userFacingOpenAIError(payload) {
  const message = payload?.error?.message || payload?.message;
  if (!message) return "OpenAI image generation failed.";
  return message;
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
    const { dishName, cuisine, caption, ingredients, plating, prompt, format = "square", model, quality, response_format } = body || {};

    if (!dishName && !prompt) {
      sendJson(response, 400, { error: "Prompt or dishName is required." });
      return;
    }

    const apiKey = process.env.OPENAI_API_KEY || process.env.chefsspecials;
    if (!apiKey) {
      sendJson(response, 200, {
        setupNeeded: true,
        message: "OpenAI image generation is ready, but the OpenAI key is not configured in this Vercel project. Add OPENAI_API_KEY to chef-specials-ai for Production, then redeploy."
      });
      return;
    }

    const activeModel = model || OPENAI_IMAGE_MODEL;
    const activeQuality = quality || OPENAI_IMAGE_QUALITY;

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

    // Determine compatible parameters based on model family
    const isDalle3 = activeModel.toLowerCase().includes("dall-e-3");
    const isDalle2 = activeModel.toLowerCase().includes("dall-e-2");

    let size = body.size;
    if (!size) {
      if (isDalle3) {
        size = format === "story" ? "1024x1792" : "1024x1024";
      } else if (isDalle2) {
        size = "1024x1024";
      } else {
        // GPT Image 2 / 2.5 series
        size = format === "story" ? "1024x1536" : "1024x1024";
      }
    } else if (isDalle3 && size === "1024x1536") {
      // DALL-E 3 does not support 1024x1536; map to closest supported aspect
      size = "1024x1792";
    }

    const requestPayload = {
      model: activeModel,
      prompt: imagePrompt,
      size
    };

    if (isDalle3) {
      requestPayload.quality = activeQuality === "hd" ? "hd" : "standard";
      requestPayload.response_format = response_format || "b64_json";
    } else if (isDalle2) {
      requestPayload.response_format = response_format || "b64_json";
    } else {
      requestPayload.quality = activeQuality;
      requestPayload.output_format = "png";
    }

    const openaiResponse = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestPayload)
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
