# Chef Specials AI

Chef Specials AI is a static restaurant menu tool for generating upscale dinner specials, chef-ready recipe details, social captions, and optional OpenAI-powered dish photos.

Live app: https://chef-specials-ai.vercel.app/

## Files

- `index.html` - application shell
- `styles.css` - responsive interface styling
- `app.js` - cuisine selection, recipe generation, saved specials, marketing kit, and image-generation UI
- `api/generate-image.js` - Vercel serverless endpoint for OpenAI image generation

## Vercel

This app is linked to the Vercel project `chef-specials-ai`.

Image generation requires `OPENAI_API_KEY` in this exact Vercel project:

1. Open Vercel project `chef-specials-ai`.
2. Go to Settings -> Environment Variables.
3. Add `OPENAI_API_KEY` for Production.
4. Redeploy the production deployment so the serverless function can read it.

Optional variables:

- `OPENAI_IMAGE_MODEL` defaults to `gpt-image-2`.
- `OPENAI_IMAGE_QUALITY` defaults to `medium`.
