import assert from "node:assert/strict";
import test from "node:test";

import {
  MANIFEST_SPECS,
  detectPrivacyIssues,
  loadTutorialContent,
  totalDurationMilliseconds,
  validateManifest,
  validateTutorialContent,
} from "../scripts/validate-content.mjs";

const tutorialContent = loadTutorialContent();

function clone(value) {
  return structuredClone(value);
}

function manifestFixture(name = "quick") {
  return clone(tutorialContent[name]);
}

test("tutorial content validates with the current quick and detailed durations", () => {
  const result = validateTutorialContent(loadTutorialContent());

  assert.equal(result.quick.durationMilliseconds, 93_000);
  assert.equal(result.quick.durationSeconds, 93);
  assert.equal(result.detailed.durationMilliseconds, 204_000);
  assert.equal(result.detailed.durationSeconds, 204);
});

test("manifest validation rejects unexpected top-level keys", () => {
  const manifest = manifestFixture("quick");
  manifest.notes = "extra";

  assert.throws(
    () => validateManifest(manifest, MANIFEST_SPECS.quick),
    /top-level keys/,
  );
});

test("manifest validation requires a non-empty description", () => {
  const manifest = manifestFixture("quick");
  manifest.description = "  ";

  assert.throws(
    () => validateManifest(manifest, MANIFEST_SPECS.quick),
    /non-empty description/,
  );
});

test("manifest validation requires string exports that are unique and exact", () => {
  const manifest = manifestFixture("quick");
  manifest.exports = [
    "prompt-vault-pro-quick-16x9.mp4",
    "prompt-vault-pro-quick-16x9.mp4",
  ];

  assert.throws(
    () => validateManifest(manifest, MANIFEST_SPECS.quick),
    /unique strings/,
  );

  manifest.exports = [
    "prompt-vault-pro-quick-16x9.mp4",
    42,
  ];

  assert.throws(
    () => validateManifest(manifest, MANIFEST_SPECS.quick),
    /strings/,
  );

  manifest.exports = [
    "prompt-vault-pro-quick-16x9.mp4",
    "prompt-vault-pro-detailed-9x16.mp4",
  ];

  assert.throws(
    () => validateManifest(manifest, MANIFEST_SPECS.quick),
    /exact exports/,
  );
});

test("manifest validation requires unique scene ids", () => {
  const manifest = manifestFixture("quick");
  manifest.scenes[1].id = manifest.scenes[0].id;

  assert.throws(
    () => validateManifest(manifest, MANIFEST_SPECS.quick),
    /unique scene ids/,
  );
});

test("manifest validation rejects scene key and type drift", () => {
  const manifest = manifestFixture("quick");
  manifest.scenes[0].durationSeconds = "15";

  assert.throws(
    () => validateManifest(manifest, MANIFEST_SPECS.quick),
    /positive numeric durationSeconds/,
  );

  delete manifest.scenes[0].route;

  assert.throws(
    () => validateManifest(manifest, MANIFEST_SPECS.quick),
    /must contain only/,
  );
});

test("duration totals normalize fractional seconds into stable milliseconds", () => {
  const manifest = manifestFixture("quick");
  const durations = [0.1, 0.2, 22, 16, 16, 38.7];

  manifest.scenes = manifest.scenes.map((scene, index) => ({
    ...scene,
    durationSeconds: durations[index],
  }));

  const result = validateManifest(manifest, MANIFEST_SPECS.quick);

  assert.equal(totalDurationMilliseconds(manifest), 93_000);
  assert.equal(result.durationMilliseconds, 93_000);
  assert.equal(result.durationSeconds, 93);
});

test("privacy scan recursively catches case-insensitive emails and token-like secrets", () => {
  const issues = detectPrivacyIssues({
    profile: {
      ownerEmail: "Person@PrivateMail.dev",
      tokens: ["GOCSPX-livevalue123456", "sb_secret_prodtoken123456"],
    },
    SERVICE_ROLE_KEY: "set",
    nested: {
      auth: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTYifQ.signatureValue123",
    },
  });

  assert.equal(issues.length, 5);
  assert.match(issues.join("\n"), /email/i);
  assert.match(issues.join("\n"), /gocspx/i);
  assert.match(issues.join("\n"), /sb_secret_/i);
  assert.match(issues.join("\n"), /service_role/i);
  assert.match(issues.join("\n"), /jwt/i);
});

test("privacy scan allows public URLs, ordinary text, and documentation examples", () => {
  const issues = detectPrivacyIssues({
    docs: {
      note: "Example email: chef@example.com",
      tokens: [
        "Documentation example: GOCSPX-your-client-id-here",
        "Placeholder secret: sb_secret_your-project-token",
        "Example JWT: eyJ...example.payload.signature",
      ],
      url: "https://app.promptvaultpro.com/library",
      guidance: "Explain the service_role key without pasting a real value.",
    },
  });

  assert.deepEqual(issues, []);
});

test("privacy scan catches exact prohibited literals case-insensitively", () => {
  const issues = detectPrivacyIssues({
    demo: {
      projectRef: "Project ref: LBIBPYPDBFCUUDLWMDJX",
      password: "Temporary password: mango1129",
    },
  });

  assert.equal(issues.length, 2);
  assert.match(issues[0], /project reference literal/i);
  assert.match(issues[1], /password literal/i);
});

test("privacy scan exempts placeholder tokens without hiding live tokens in the same string", () => {
  const issues = detectPrivacyIssues({
    guidance:
      "Use Documentation example: GOCSPX-your-client-id-here, then replace it with GOCSPX-livevalue123456.",
  });

  assert.deepEqual(issues, ["$.guidance: found GOCSPX token-like value"]);
});

test("privacy scan checks all email matches instead of only the first one", () => {
  const issues = detectPrivacyIssues({
    copy: "Example email: chef@example.com. Contact owner@privatemail.dev for access.",
  });

  assert.deepEqual(issues, ["$.copy: found email address"]);
});

test("privacy scan catches prefixed service role-style environment keys", () => {
  const issues = detectPrivacyIssues({
    VITE_SUPABASE_SERVICE_ROLE_KEY: "set",
  });

  assert.deepEqual(issues, ["$.{VITE_SUPABASE_SERVICE_ROLE_KEY}: found service_role-style key"]);
});
