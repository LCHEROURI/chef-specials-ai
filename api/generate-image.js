const OPENAI_IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1.5";

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    response.status(200).json({
      setupNeeded: true,
      message: "Photo generation is not connected yet. Add OPENAI_API_KEY to Vercel Production, redeploy, then run Generate Professional Photo again."
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
        quality: "high",
        output_format: "png"
      })
    });

    const payload = await openaiResponse.json();
    if (!openaiResponse.ok) {
      response.status(openaiResponse.status).json({
        error: payload.error?.message || "OpenAI image generation failed."
      });
      return;
    }

    const b64 = payload.data?.[0]?.b64_json;
    if (!b64) {
      response.status(502).json({ error: "OpenAI returned no image data." });
      return;
    }

    response.status(200).json({
      imageUrl: `data:image/png;base64,${b64}`,
      revisedPrompt: payload.data?.[0]?.revised_prompt || imagePrompt
    });
  } catch (error) {
    response.status(500).json({ error: error.message || "Unexpected image generation error." });
  }
};
