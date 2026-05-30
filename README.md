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

Image generation requires `OPENAI_API_KEY` in Vercel production environment variables. The optional `OPENAI_IMAGE_MODEL` variable defaults to `gpt-image-1.5`.
