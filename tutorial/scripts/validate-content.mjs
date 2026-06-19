import { readFileSync } from "node:fs";
import path from "node:path";

const tutorialDir = path.resolve(import.meta.dirname, "..");

const manifestKeys = [
  "description",
  "exports",
  "format",
  "name",
  "scenes",
];

const requiredSceneKeys = [
  "action",
  "caption",
  "durationSeconds",
  "focus",
  "id",
  "narration",
  "route",
];

const emailPattern = /\b[A-Z0-9._%+-]+@(?:[A-Z0-9-]+\.)+[A-Z]{2,}\b/i;
const gocspxPattern = /\bGOCSPX-[A-Z0-9_-]{6,}\b/i;
const sbSecretPattern = /\bsb_secret_[a-z0-9_-]{6,}\b/i;
const jwtPattern =
  /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/;

const exampleEmailDomains = new Set([
  "example.com",
  "example.org",
  "example.net",
]);

const prohibitedLiteralChecks = Object.freeze([
  Object.freeze({
    normalizedValue: "lbibpypdbfcuudlwmdjx",
    issue: "found prohibited project reference literal",
  }),
  Object.freeze({
    normalizedValue: "mango1129",
    issue: "found prohibited password literal",
  }),
]);

export const MANIFEST_SPECS = Object.freeze({
  quick: Object.freeze({
    name: "quick",
    expectedExports: Object.freeze([
      "prompt-vault-pro-quick-16x9.mp4",
      "prompt-vault-pro-quick-9x16.mp4",
    ]),
    minDurationMilliseconds: 75_000,
    maxDurationMilliseconds: 100_000,
    sceneCount: 6,
  }),
  detailed: Object.freeze({
    name: "detailed",
    expectedExports: Object.freeze([
      "prompt-vault-pro-detailed-16x9.mp4",
      "prompt-vault-pro-detailed-9x16.mp4",
    ]),
    minDurationMilliseconds: 180_000,
    maxDurationMilliseconds: 240_000,
    sceneCount: 12,
  }),
});

export function readJson(relativePath) {
  return JSON.parse(
    readFileSync(path.join(tutorialDir, relativePath), "utf8"),
  );
}

export function readText(relativePath) {
  return readFileSync(path.join(tutorialDir, relativePath), "utf8");
}

export function loadTutorialContent() {
  return {
    demo: readJson("content/demo-content.json"),
    quick: readJson("content/quick-script.json"),
    detailed: readJson("content/detailed-script.json"),
    sampleMenu: readText("content/sample-menu.txt"),
  };
}

export function normalizeDurationMilliseconds(durationSeconds) {
  return Math.round(durationSeconds * 1000);
}

export function totalDurationMilliseconds(manifest) {
  return manifest.scenes.reduce(
    (total, scene) =>
      total + normalizeDurationMilliseconds(scene.durationSeconds),
    0,
  );
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function sortedKeys(value) {
  return Object.keys(value).sort();
}

function exactKeysMatch(value, expectedKeys) {
  return JSON.stringify(sortedKeys(value)) === JSON.stringify(expectedKeys);
}

function uniqueNonEmptyStrings(values) {
  return (
    values.length > 0 &&
    values.every((value) => typeof value === "string" && value.trim().length > 0) &&
    new Set(values).size === values.length
  );
}

function sortedStrings(values) {
  return [...values].sort();
}

function matchPattern(value, pattern) {
  const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;

  return [...value.matchAll(new RegExp(pattern.source, flags))];
}

function exampleEmail(value) {
  const domain = value.split("@")[1].toLowerCase();
  return exampleEmailDomains.has(domain);
}

function documentationExample(value) {
  const normalized = value.toLowerCase();
  const contextHints = [
    "example",
    "documentation",
    "docs",
    "placeholder",
    "sample",
    "fictional",
    "dummy",
    "redacted",
  ];
  const placeholderHints = [
    "your-",
    "your_",
    "your ",
    "here",
    "<",
    "[",
    "prefix",
    "token",
    "client id",
    "do not paste",
    "without pasting",
    "real value",
  ];

  return (
    contextHints.some((hint) => normalized.includes(hint)) &&
    placeholderHints.some((hint) => normalized.includes(hint))
  );
}

function matchContext(value, match, radius = 24) {
  const start = Math.max(0, (match.index ?? 0) - radius);
  const end = Math.min(value.length, (match.index ?? 0) + match[0].length + radius);

  return value.slice(start, end);
}

function serviceRoleKeyName(value) {
  const normalized = value
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toLowerCase();

  return /(?:^|[_-])(?:supabase[_-])?service[_-]?role(?:[_-]?key)?(?:$|[_-])/.test(
    normalized,
  );
}

function collectStringEntries(value, currentPath = "$") {
  if (typeof value === "string") {
    return [{ path: currentPath, value, kind: "value" }];
  }

  if (Array.isArray(value)) {
    return value.flatMap((entry, index) =>
      collectStringEntries(entry, `${currentPath}[${index}]`),
    );
  }

  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, nested]) => [
      { path: `${currentPath}.{${key}}`, value: key, kind: "key" },
      ...collectStringEntries(nested, `${currentPath}.${key}`),
    ]);
  }

  return [];
}

export function detectPrivacyIssues(value) {
  return collectStringEntries(value).flatMap(({ path: entryPath, value: entryValue, kind }) => {
    const issues = [];

    if (kind === "key" && serviceRoleKeyName(entryValue)) {
      issues.push(`${entryPath}: found service_role-style key`);
    }

    if (kind === "value") {
      const normalizedValue = entryValue.toLowerCase();

      for (const { normalizedValue: prohibitedLiteral, issue } of prohibitedLiteralChecks) {
        if (normalizedValue.includes(prohibitedLiteral)) {
          issues.push(`${entryPath}: ${issue}`);
        }
      }

      for (const [match] of matchPattern(entryValue, emailPattern)) {
        if (!exampleEmail(match)) {
          issues.push(`${entryPath}: found email address`);
        }
      }

      for (const tokenMatch of matchPattern(entryValue, gocspxPattern)) {
        if (!documentationExample(matchContext(entryValue, tokenMatch))) {
          issues.push(`${entryPath}: found GOCSPX token-like value`);
        }
      }

      for (const tokenMatch of matchPattern(entryValue, sbSecretPattern)) {
        if (!documentationExample(matchContext(entryValue, tokenMatch))) {
          issues.push(`${entryPath}: found sb_secret_ token-like value`);
        }
      }

      for (const tokenMatch of matchPattern(entryValue, jwtPattern)) {
        if (!documentationExample(matchContext(entryValue, tokenMatch))) {
          issues.push(`${entryPath}: found JWT-like token`);
        }
      }
    }

    return issues;
  });
}

function assertPrivacySafe(value, label) {
  const issues = detectPrivacyIssues(value);

  assert(
    issues.length === 0,
    `${label}: privacy scan failed\n- ${issues.join("\n- ")}`,
  );
}

export function validateManifest(manifest, spec) {
  assert(
    manifest && typeof manifest === "object" && !Array.isArray(manifest),
    `${spec.name}: manifest must be an object`,
  );
  assert(
    exactKeysMatch(manifest, manifestKeys),
    `${spec.name}: top-level keys must be exactly ${manifestKeys.join(", ")}`,
  );
  assert(
    manifest.name === spec.name,
    `${spec.name}: expected matching manifest name`,
  );
  assert(
    manifest.format === "guided-product-tour",
    `${spec.name}: format must be guided-product-tour`,
  );
  assert(
    typeof manifest.description === "string" &&
      manifest.description.trim().length > 0,
    `${spec.name}: manifest must have a non-empty description`,
  );
  assert(Array.isArray(manifest.exports), `${spec.name}: exports must be an array`);
  assert(
    uniqueNonEmptyStrings(manifest.exports),
    `${spec.name}: exports must be unique strings`,
  );
  assert(
    JSON.stringify(sortedStrings(manifest.exports)) ===
      JSON.stringify(sortedStrings(spec.expectedExports)),
    `${spec.name}: exports must match the exact exports ${spec.expectedExports.join(", ")}`,
  );
  assert(Array.isArray(manifest.scenes), `${spec.name}: scenes must be an array`);
  assert(
    manifest.scenes.length === spec.sceneCount,
    `${spec.name}: expected ${spec.sceneCount} scenes, found ${manifest.scenes.length}`,
  );

  const sceneIds = new Set();

  for (const [index, scene] of manifest.scenes.entries()) {
    assert(
      scene && typeof scene === "object" && !Array.isArray(scene),
      `${spec.name}: scene ${index + 1} must be an object`,
    );
    assert(
      exactKeysMatch(scene, requiredSceneKeys),
      `${spec.name}: scene ${index + 1} must contain only ${requiredSceneKeys.join(", ")}`,
    );

    for (const key of requiredSceneKeys) {
      const sceneValue = scene[key];

      if (key === "durationSeconds") {
        assert(
          typeof sceneValue === "number" &&
            Number.isFinite(sceneValue) &&
            sceneValue > 0,
          `${spec.name}: scene ${index + 1} must have a positive numeric durationSeconds`,
        );
        continue;
      }

      assert(
        typeof sceneValue === "string" && sceneValue.trim().length > 0,
        `${spec.name}: scene ${index + 1} must have a non-empty ${key}`,
      );
    }

    assert(
      !sceneIds.has(scene.id),
      `${spec.name}: scenes must have unique scene ids`,
    );
    sceneIds.add(scene.id);
  }

  const durationMilliseconds = totalDurationMilliseconds(manifest);

  assert(
    durationMilliseconds >= spec.minDurationMilliseconds &&
      durationMilliseconds <= spec.maxDurationMilliseconds,
    `${spec.name}: duration ${durationMilliseconds / 1000}s must be between ${
      spec.minDurationMilliseconds / 1000
    }s and ${spec.maxDurationMilliseconds / 1000}s`,
  );

  return {
    durationMilliseconds,
    durationSeconds: durationMilliseconds / 1000,
  };
}

export function validateTutorialContent(content = loadTutorialContent()) {
  const quick = validateManifest(content.quick, MANIFEST_SPECS.quick);
  const detailed = validateManifest(content.detailed, MANIFEST_SPECS.detailed);

  assertPrivacySafe(content.demo, "demo-content.json");
  assertPrivacySafe(content.quick, "quick-script.json");
  assertPrivacySafe(content.detailed, "detailed-script.json");
  assertPrivacySafe(content.sampleMenu, "sample-menu.txt");

  return { quick, detailed };
}

export function main() {
  const result = validateTutorialContent();

  console.log(`quick duration: ${result.quick.durationSeconds}s`);
  console.log(`detailed duration: ${result.detailed.durationSeconds}s`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === import.meta.filename) {
  main();
}
