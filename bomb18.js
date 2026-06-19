const fs = require("fs");
const path = require("path");

const DEFAULT_URL =
  "https://nhaitienganh.vercel.app/api/v1/student/quizzes/04b490ba-8882-43db-b738-c75b83fc0a4c/submit";
const LOCAL_AUTH_FILE = path.join(__dirname, "rate-limit-auth.local.json");
const LOCAL_AUTH_EXAMPLE_FILE = path.join(__dirname, "rate-limit-auth.local.example.json");

const DEFAULT_ANSWERS = {
  "9dd8a919-3d13-4e21-94bc-75ebc4b24f06": "d0db5ecd-dc0e-43eb-afbd-313150f7927b",
  "df468c2d-99f4-414c-bf04-4f0e5bea0faa": "3d62f881-d1d2-4782-add1-f720375e269f",
  "54b3560f-5a90-41a8-8a99-97e902e1c824": "45744993-794f-42af-a687-c974a15e11a9",
  "fbab802a-8cbf-430e-b079-535119d49067": "808c5bec-98fe-42df-91bf-361940767f89",
};

function parseArgs(argv) {
  const args = {
    url: DEFAULT_URL,
    count: 20000,
    concurrency: 500,
    delayMs: 500,
    cookie: "",
    csrfToken: "",
    stopOn429: true,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const key = argv[i];
    const value = argv[i + 1];

    if (key === "--url") args.url = value, i += 1;
    else if (key === "--count") args.count = Number(value), i += 1;
    else if (key === "--concurrency") args.concurrency = Number(value), i += 1;
    else if (key === "--delay-ms") args.delayMs = Number(value), i += 1;
    else if (key === "--cookie") args.cookie = value, i += 1;
    else if (key === "--csrf-token") args.csrfToken = value, i += 1;
    else if (key === "--no-stop-on-429") args.stopOn429 = false;
    else if (key === "--help") {
      printHelp();
      process.exit(0);
    }
  }

  args.count = clampInteger(args.count, 1, 30, "count");
  args.concurrency = clampInteger(args.concurrency, 1, 3, "concurrency");
  args.delayMs = clampInteger(args.delayMs, 0, 60_000, "delay-ms");

  return args;
}

function clampInteger(value, min, max, name) {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`--${name} must be an integer from ${min} to ${max}`);
  }
  return value;
}

function printHelp() {
  console.log(`
Safe rate-limit checker for quiz submission.

Usage:
  node quiz-submit-rate-limit-check.js

Auth:
  COOKIE      Full Cookie header, for example "nta_csrf=...; nta_token=...; nta_refresh=..."
  CSRF_TOKEN  Optional value sent in x-csrf-token.
  Local file   ${LOCAL_AUTH_FILE}

Options:
  --url <url>           Target quiz submit URL. Defaults to ${DEFAULT_URL}
  --count <n>           Total requests, 1..30. Default: 20.
  --concurrency <n>     Parallel requests, 1..3. Default: 2.
  --delay-ms <n>        Delay between request starts per worker. Default: 500.
  --cookie <value>      Full Cookie header. Overrides COOKIE env/local file.
  --csrf-token <value>  CSRF token. Overrides CSRF_TOKEN env/local file.
  --no-stop-on-429      Continue after first 429.
`);
}

function readLocalAuth() {
  if (!fs.existsSync(LOCAL_AUTH_FILE)) {
    return {};
  }

  const raw = fs.readFileSync(LOCAL_AUTH_FILE, "utf8");
  const parsed = JSON.parse(raw);
  return {
    cookie: parsed.cookie || "",
    csrfToken: parsed.csrfToken || "",
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
}