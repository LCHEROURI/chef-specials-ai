# Prompt Vault Pro Tutorial Content

This folder holds the reproducible, privacy-safe source content for the Prompt
Vault Pro beta tutorial videos.

## What lives here

- `content/demo-content.json`: fictional prompt data used in demos
- `content/sample-menu.txt`: fictional knowledge file used in recordings
- `content/quick-script.json`: quick guided tour scene manifest
- `content/detailed-script.json`: detailed guided tour scene manifest
- `scripts/validate-content.mjs`: validation for durations, scene shape,
  privacy terms, and export names
- `tests/content.test.mjs`: Node tests for the tutorial content contract

## Prerequisites

- Node.js 22 or newer

## Commands

Run these from the repository root:

```bash
node tutorial/scripts/validate-content.mjs
node --test tutorial/tests/content.test.mjs
```

The validator prints the quick and detailed total durations so later capture,
narration, and render steps can reuse the same timing.

## Expected export names

The content is locked to these four final MP4 names:

- `prompt-vault-pro-quick-16x9.mp4`
- `prompt-vault-pro-quick-9x16.mp4`
- `prompt-vault-pro-detailed-16x9.mp4`
- `prompt-vault-pro-detailed-9x16.mp4`

Generated captures, audio, work files, and rendered exports are ignored by git
under:

- `tutorial/captures/`
- `tutorial/audio/`
- `tutorial/work/`
- `tutorial/output/`

## Privacy rules

- Use fictional content only.
- Do not include personal email addresses, project secrets, auth tokens, or
  provider credentials in narration, captions, demo text, or filenames.
- Keep the demo centered on the fictional `Restaurant Menu Improvement` prompt
  and the fictional menu file in `content/sample-menu.txt`.
