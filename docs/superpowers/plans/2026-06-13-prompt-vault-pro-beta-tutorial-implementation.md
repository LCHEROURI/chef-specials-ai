# Prompt Vault Pro Beta Tutorial Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve required-field feedback, then produce four privacy-safe Prompt Vault Pro beta tutorial videos with AI narration, captions, and landscape/vertical exports.

**Architecture:** The product fix remains inside the React app and is covered by a focused component test. Tutorial production lives in `tutorial/`: scripts define narration and timed scenes, Browser automation captures privacy-safe production screenshots, macOS speech generates narration, and FFmpeg assembles branded motion scenes, captions, audio, and final MP4 exports. Large generated media stays under ignored `tutorial/output/`; scripts, manifests, captions, and small source assets remain reproducible and versioned.

**Tech Stack:** React 19, React Hook Form, Vitest, Testing Library, Browser plugin, Node.js, macOS `say`, FFmpeg, H.264/AAC, SRT captions.

---

## File Structure

- Modify `src/features/prompts/PromptEditor.tsx`
  - Focus the first invalid field and show a prominent save-error summary.
- Create `src/features/prompts/PromptEditor.test.tsx`
  - Reproduce the missing-title confusion and verify accessible recovery.
- Modify `.gitignore`
  - Ignore generated audio, screenshots, intermediate renders, and MP4 exports.
- Create `tutorial/README.md`
  - Document prerequisites, commands, outputs, and privacy rules.
- Create `tutorial/content/demo-content.json`
  - Hold fictional prompt and knowledge-file copy used in recordings.
- Create `tutorial/content/quick-script.json`
  - Define quick-video scenes, narration, captions, and target durations.
- Create `tutorial/content/detailed-script.json`
  - Define detailed-video scenes, narration, captions, and target durations.
- Create `tutorial/content/sample-menu.txt`
  - Provide a fictional optional knowledge file.
- Create `tutorial/scripts/validate-content.mjs`
  - Validate timing, required fields, privacy terms, and export names.
- Create `tutorial/scripts/capture-scenes.mjs`
  - Capture the approved live-app states through the Browser workflow.
- Create `tutorial/scripts/generate-narration.mjs`
  - Generate AI-style narration audio with the selected macOS voice.
- Create `tutorial/scripts/generate-captions.mjs`
  - Convert scene timings and narration into SRT files.
- Create `tutorial/scripts/render-video.mjs`
  - Build title cards, motion scenes, captions, narration, and MP4 outputs.
- Create `tutorial/scripts/verify-exports.mjs`
  - Use `ffprobe` to verify dimensions, codecs, duration, audio, and filenames.
- Create `tutorial/assets/brand-card.svg`
  - Reusable Prompt Vault Pro opening/closing card source.
- Create `tutorial/tests/content.test.mjs`
  - Test script structure, privacy constraints, and duration targets.
- Create `tutorial/tests/captions.test.mjs`
  - Test SRT sequencing and two-line caption limits.
- Generate `tutorial/captions/prompt-vault-pro-quick.srt`
- Generate `tutorial/captions/prompt-vault-pro-detailed.srt`
- Generate ignored files in `tutorial/output/`
  - `prompt-vault-pro-quick-16x9.mp4`
  - `prompt-vault-pro-quick-9x16.mp4`
  - `prompt-vault-pro-detailed-16x9.mp4`
  - `prompt-vault-pro-detailed-9x16.mp4`
- Create `tutorial/distribution-message.md`
  - Provide beta-tester email/message copy with app and video placeholders.

### Task 1: Make Missing-Title Saves Unmistakable

**Files:**
- Create: `src/features/prompts/PromptEditor.test.tsx`
- Modify: `src/features/prompts/PromptEditor.tsx`

- [ ] **Step 1: Write the failing component test**

Render `PromptEditor` inside the existing application providers and router.
Mock `savePrompt`, entitlement loading, and organization APIs. Submit a valid
prompt body with an empty title and assert:

```tsx
expect(
  await screen.findByRole("alert", {
    name: "Prompt could not be saved"
  })
).toHaveTextContent("Add a title before saving your prompt.");
expect(screen.getByLabelText(/Title/)).toHaveFocus();
expect(savePrompt).not.toHaveBeenCalled();
expect(screen.getByLabelText(/Prompt content/)).toHaveValue(
  "Analyze this fictional restaurant menu."
);
```

- [ ] **Step 2: Run the test and verify the expected failure**

Run:

```bash
npm test -- --run src/features/prompts/PromptEditor.test.tsx
```

Expected: FAIL because the editor currently renders only the inline
`Title is required` message and does not focus the field.

- [ ] **Step 3: Implement focused invalid-submit handling**

Update `useForm` destructuring to include `setFocus`. Add:

```tsx
const [submitError, setSubmitError] = useState<string | null>(null);

function handleInvalidSubmit() {
  if (errors.title || !getValues("title").trim()) {
    setSubmitError("Add a title before saving your prompt.");
    setFocus("title");
    return;
  }
  setSubmitError("Review the highlighted fields before saving your prompt.");
}
```

Wire the form with both React Hook Form callbacks:

```tsx
onSubmit={handleSubmit(
  (values) => {
    setSubmitError(null);
    mutation.mutate(values);
  },
  handleInvalidSubmit
)}
```

Render the prominent summary immediately above `.editor-actions`:

```tsx
{submitError ? (
  <div
    aria-label="Prompt could not be saved"
    className="form-error"
    role="alert"
  >
    {submitError}
  </div>
) : null}
```

Keep draft persistence unchanged.

- [ ] **Step 4: Run focused and full verification**

Run:

```bash
npm test -- --run src/features/prompts/PromptEditor.test.tsx
npm test -- --run
npm run lint
npm run build
```

Expected: focused test passes, 0 full-suite failures, lint exits 0, and Vite
build exits 0.

- [ ] **Step 5: Commit the product fix**

```bash
git add src/features/prompts/PromptEditor.tsx \
  src/features/prompts/PromptEditor.test.tsx
git commit -m "fix: clarify required prompt fields"
```

### Task 2: Define Reproducible, Privacy-Safe Tutorial Content

**Files:**
- Modify: `.gitignore`
- Create: `tutorial/README.md`
- Create: `tutorial/content/demo-content.json`
- Create: `tutorial/content/quick-script.json`
- Create: `tutorial/content/detailed-script.json`
- Create: `tutorial/content/sample-menu.txt`
- Create: `tutorial/tests/content.test.mjs`
- Create: `tutorial/scripts/validate-content.mjs`

- [ ] **Step 1: Add generated-media ignores**

Append:

```gitignore
tutorial/captures/
tutorial/audio/
tutorial/work/
tutorial/output/
```

- [ ] **Step 2: Write failing content-validation tests**

Use Node's built-in test runner. Verify:

```js
assert.equal(quick.format, "guided-product-tour");
assert.ok(quick.scenes.length >= 5);
assert.ok(totalDuration(quick) >= 75 && totalDuration(quick) <= 100);
assert.ok(totalDuration(detailed) >= 180 && totalDuration(detailed) <= 240);
assert.deepEqual(exports.sort(), [
  "prompt-vault-pro-detailed-16x9.mp4",
  "prompt-vault-pro-detailed-9x16.mp4",
  "prompt-vault-pro-quick-16x9.mp4",
  "prompt-vault-pro-quick-9x16.mp4"
]);
```

Scan every narration and on-screen string for prohibited personal data:

```js
const prohibited = [
  "cherouri@gmail.com",
  "lbibpypdbfcuudlwmdjx",
  "Mango1129",
  "GOCSPX-"
];
```

- [ ] **Step 3: Run tests and verify they fail**

Run:

```bash
node --test tutorial/tests/content.test.mjs
```

Expected: FAIL because tutorial content files do not exist.

- [ ] **Step 4: Create the demo and timed scene manifests**

Use this demo content:

```json
{
  "title": "Restaurant Menu Improvement",
  "description": "Find practical ways to improve a restaurant menu.",
  "category": "Restaurants",
  "platform": "ChatGPT",
  "tag": "Menu planning",
  "promptText": "Act as an experienced restaurant consultant. Review the fictional menu provided and identify opportunities to improve clarity, profitability, item placement, and guest appeal. Return prioritized recommendations with reasons and practical next steps."
}
```

Each scene record must include:

```json
{
  "id": "create-prompt",
  "durationSeconds": 24,
  "route": "/prompts/new",
  "action": "complete-demo-prompt",
  "narration": "Select New prompt, then add a clear title and paste your prompt content.",
  "caption": "Add a title and your reusable prompt.",
  "focus": "prompt-editor"
}
```

The quick manifest totals 75-100 seconds. The detailed manifest totals
180-240 seconds and contains the approved twelve storyboard sections.

- [ ] **Step 5: Implement and run content validation**

`validate-content.mjs` loads both manifests, checks required keys, totals
duration, rejects prohibited strings, and verifies the four output names.

Run:

```bash
node tutorial/scripts/validate-content.mjs
node --test tutorial/tests/content.test.mjs
```

Expected: both commands exit 0 and print the quick/detailed durations.

- [ ] **Step 6: Commit tutorial content**

```bash
git add .gitignore tutorial/README.md tutorial/content \
  tutorial/tests/content.test.mjs tutorial/scripts/validate-content.mjs
git commit -m "feat: define beta tutorial content"
```

### Task 3: Capture the Live Product Scenes

**Files:**
- Create: `tutorial/scripts/capture-scenes.mjs`
- Generate ignored: `tutorial/captures/*.png`

- [ ] **Step 1: Implement capture manifest parsing**

`capture-scenes.mjs` accepts:

```bash
node tutorial/scripts/capture-scenes.mjs \
  --base-url https://prompt-vault-pro-eight.vercel.app \
  --manifest tutorial/content/quick-script.json
```

It prints the ordered Browser actions and target filenames for the agent
running the Browser plugin. The script must reject any target route containing
`accounts.google.com`, `supabase.com/dashboard`, or `vercel.com`.

- [ ] **Step 2: Create privacy-safe demo state**

Use the production app with the existing authenticated session. Create or
update the fictional `Restaurant Menu Improvement` prompt only. Do not open
account menus. If a sign-in shot is needed, use the app's `/auth` page before
clicking Google, so no email appears.

- [ ] **Step 3: Capture desktop frames**

Set the Browser viewport to 1440x900 and capture:

```text
01-opening-library.png
02-auth-page.png
03-new-prompt-empty.png
04-new-prompt-complete.png
05-prompt-saved.png
06-recently-added.png
07-search-results.png
08-prompt-detail.png
09-knowledge-files.png
10-version-history.png
11-templates.png
12-import.png
```

For each frame, confirm:

- The intended route and heading are visible.
- No personal email or account identity is visible.
- No error overlay or failed request appears.
- The active control is within the central 60% of the image when possible.

- [ ] **Step 4: Capture mobile reference frames**

Set the Browser viewport to 390x844 and capture key vertical references:

```text
mobile-library.png
mobile-new-prompt.png
mobile-prompt-detail.png
```

Use these to choose vertical crops rather than stretching desktop footage.

- [ ] **Step 5: Verify capture dimensions and privacy**

Run:

```bash
ffprobe -v error -select_streams v:0 \
  -show_entries stream=width,height \
  -of csv=s=x:p=0 tutorial/captures/01-opening-library.png
rg -a -n 'cherouri@gmail.com|GOCSPX-|Mango1129' tutorial/captures || true
```

Expected: desktop frame reports `1440x900`; privacy scan prints no matches.

- [ ] **Step 6: Commit the capture workflow**

```bash
git add tutorial/scripts/capture-scenes.mjs
git commit -m "feat: add tutorial capture workflow"
```

### Task 4: Generate Narration and Captions

**Files:**
- Create: `tutorial/scripts/generate-narration.mjs`
- Create: `tutorial/scripts/generate-captions.mjs`
- Create: `tutorial/tests/captions.test.mjs`
- Generate: `tutorial/captions/prompt-vault-pro-quick.srt`
- Generate: `tutorial/captions/prompt-vault-pro-detailed.srt`
- Generate ignored: `tutorial/audio/*.aiff`

- [ ] **Step 1: Write failing caption tests**

Verify SRT generation:

```js
assert.equal(cues[0].index, 1);
assert.equal(cues[0].start, "00:00:00,000");
assert.ok(cues.every((cue) => cue.endMs > cue.startMs));
assert.ok(cues.every((cue) => cue.text.split("\n").length <= 2));
assert.ok(cues.at(-1).endMs <= manifestDurationMs);
```

- [ ] **Step 2: Run tests and verify they fail**

Run:

```bash
node --test tutorial/tests/captions.test.mjs
```

Expected: FAIL because caption generation does not exist.

- [ ] **Step 3: Implement narration generation**

Use a configurable voice with a stable default:

```bash
say -v Samantha -r 175 \
  -o tutorial/audio/quick-scene-01.aiff \
  "Welcome to Prompt Vault Pro."
```

Generate one AI-narrated AIFF per scene so timing can be adjusted without
regenerating the full video. Reject empty narration and print audio duration
using `ffprobe`.

- [ ] **Step 4: Implement SRT generation**

Use cumulative scene durations. Wrap captions at natural phrase boundaries,
maximum 42 characters per line and two lines per cue. Generate one SRT per
unique script because landscape and vertical share narration timing.

- [ ] **Step 5: Generate and test narration/captions**

Run:

```bash
node tutorial/scripts/generate-narration.mjs \
  tutorial/content/quick-script.json
node tutorial/scripts/generate-narration.mjs \
  tutorial/content/detailed-script.json
node tutorial/scripts/generate-captions.mjs
node --test tutorial/tests/captions.test.mjs
```

Expected: all scene audio files exist, two SRT files exist, and tests pass.

- [ ] **Step 6: Commit reusable narration sources**

```bash
git add tutorial/scripts/generate-narration.mjs \
  tutorial/scripts/generate-captions.mjs \
  tutorial/tests/captions.test.mjs tutorial/captions
git commit -m "feat: generate tutorial narration and captions"
```

### Task 5: Render Four Branded Videos

**Files:**
- Create: `tutorial/assets/brand-card.svg`
- Create: `tutorial/scripts/render-video.mjs`
- Generate ignored: `tutorial/work/*`
- Generate ignored: `tutorial/output/*.mp4`

- [ ] **Step 1: Create the reusable brand card**

The SVG uses:

```text
Background: #176b54
Primary text: #ffffff
Secondary text: #d7eee6
Opening: Welcome to Prompt Vault Pro / Create. Organize. Reuse.
Closing: You're ready. / Add a prompt, test the workflow, and share your beta feedback.
```

Keep all text inside the center 60% so it works in both orientations.

- [ ] **Step 2: Implement scene rendering**

For each scene:

1. Scale and crop its source screenshot to the target frame.
2. Add a subtle 2-4% Ken Burns zoom toward the scene's `focus`.
3. Add a soft green cursor ring when the scene includes an action.
4. Pad or trim to `durationSeconds`.
5. Attach the corresponding AIFF narration.

Use FFmpeg filter graphs. Landscape base:

```text
scale=1920:1200:force_original_aspect_ratio=increase,
crop=1920:1080,
zoompan=z='min(zoom+0.00035,1.04)':d=1:s=1920x1080
```

Vertical base:

```text
scale=1080:1920:force_original_aspect_ratio=increase,
crop=1080:1920,
zoompan=z='min(zoom+0.00035,1.04)':d=1:s=1080x1920
```

Use mobile reference screenshots for scenes where a desktop crop hides the
active control.

- [ ] **Step 3: Assemble and caption each export**

Render:

```bash
node tutorial/scripts/render-video.mjs --script quick --aspect 16x9
node tutorial/scripts/render-video.mjs --script quick --aspect 9x16
node tutorial/scripts/render-video.mjs --script detailed --aspect 16x9
node tutorial/scripts/render-video.mjs --script detailed --aspect 9x16
```

Final FFmpeg settings:

```text
Video: libx264, yuv420p, CRF 20, preset medium, 30 fps
Audio: AAC, 192 kbps, 48 kHz
Captions: burned in from matching SRT
Audio loudness: loudnorm target -16 LUFS
Fast start: -movflags +faststart
```

- [ ] **Step 4: Review first renders and adjust scene timing**

Watch quick landscape and detailed landscape from beginning to end. Adjust:

- Narration pauses.
- Caption line breaks.
- Cursor-ring position.
- Zoom target.
- Scene duration where speech feels rushed.

Regenerate both landscape versions, then render vertical versions from the
approved timing.

- [ ] **Step 5: Commit rendering sources**

```bash
git add tutorial/assets/brand-card.svg tutorial/scripts/render-video.mjs
git commit -m "feat: render branded tutorial videos"
```

### Task 6: Verify Exports and Prepare Beta Distribution

**Files:**
- Create: `tutorial/scripts/verify-exports.mjs`
- Create: `tutorial/distribution-message.md`
- Modify: `tutorial/README.md`

- [ ] **Step 1: Implement export verification**

For every MP4, call `ffprobe` and assert:

```js
{
  videoCodec: "h264",
  audioCodec: "aac",
  pixelFormat: "yuv420p",
  frameRate: 30
}
```

Assert dimensions:

```text
16x9: 1920x1080
9x16: 1080x1920
```

Assert quick duration is 75-105 seconds and detailed duration is 180-250
seconds.

- [ ] **Step 2: Run automated export checks**

Run:

```bash
node tutorial/scripts/verify-exports.mjs
```

Expected: four PASS lines with filename, dimensions, duration, H.264, and AAC.

- [ ] **Step 3: Perform visual and privacy QA**

Watch all four videos from beginning to end. Check:

- No personal email, provider secret, account menu, or private file appears.
- Captions match narration and never exceed two lines.
- Active controls remain visible in both orientations.
- The app URL is correct on closing cards.
- No silent gaps, clipped words, abrupt cuts, or unreadable text.

- [ ] **Step 4: Write the beta-tester distribution message**

Create:

```markdown
Subject: Help test Prompt Vault Pro

Prompt Vault Pro helps you save, organize, and reuse your best AI prompts.

App: https://prompt-vault-pro-eight.vercel.app/
Quick tutorial: [QUICK_VIDEO_LINK]
Detailed tutorial: [DETAILED_VIDEO_LINK]

Please report:
- Anything that fails
- Anything that feels confusing
- Features or steps you expected but could not find
- Mobile layout problems
```

- [ ] **Step 5: Update reproduction instructions**

Document:

```bash
node tutorial/scripts/validate-content.mjs
node tutorial/scripts/generate-narration.mjs tutorial/content/quick-script.json
node tutorial/scripts/generate-narration.mjs tutorial/content/detailed-script.json
node tutorial/scripts/generate-captions.mjs
node tutorial/scripts/render-video.mjs --script quick --aspect 16x9
node tutorial/scripts/render-video.mjs --script quick --aspect 9x16
node tutorial/scripts/render-video.mjs --script detailed --aspect 16x9
node tutorial/scripts/render-video.mjs --script detailed --aspect 9x16
node tutorial/scripts/verify-exports.mjs
```

- [ ] **Step 6: Run final project verification**

Run:

```bash
npm test -- --run
npm run lint
npm run build
node --test tutorial/tests/*.test.mjs
node tutorial/scripts/verify-exports.mjs
git diff --check
```

Expected: all tests pass, lint/build exit 0, four video checks pass, and
`git diff --check` prints nothing.

- [ ] **Step 7: Commit production documentation**

```bash
git add tutorial/README.md tutorial/distribution-message.md \
  tutorial/scripts/verify-exports.mjs
git commit -m "docs: prepare beta tutorial distribution"
```

- [ ] **Step 8: Deliver the four videos**

Return clickable absolute paths to all four MP4 files, both SRT files, the
narration scripts, and the distribution message. Include total durations and
file sizes. Do not claim completion until all four videos have been watched
and `verify-exports.mjs` passes.
