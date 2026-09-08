/**
 * QA helper: submit the public application form the way a browser with
 * JavaScript disabled would, exercising the real Server Action end to end —
 * validation, rate limiting and the database write included.
 *
 * Next.js renders hidden `$ACTION_*` fields on the form for progressive
 * enhancement. Replaying those verbatim alongside the user fields invokes the
 * action for real.
 *
 * Usage: node scripts/qa-submit-application.cjs http://localhost:3000
 */

const BASE = process.argv[2] || "http://localhost:3000";

/** Pull every hidden `$ACTION_*` input out of the rendered form. */
function readActionFields(html) {
  const fields = [];
  const inputPattern = /<input[^>]*type="hidden"[^>]*>/g;
  let match;
  while ((match = inputPattern.exec(html)) !== null) {
    const tag = match[0];
    const name = tag.match(/name="(\$ACTION[^"]*)"/);
    if (!name) continue;
    const value = tag.match(/value="([^"]*)"/);
    fields.push({
      name: decodeEntities(name[1]),
      value: value ? decodeEntities(value[1]) : "",
    });
  }
  return fields;
}

function decodeEntities(value) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

async function main() {
  const pageResponse = await fetch(`${BASE}/apply`);
  if (!pageResponse.ok) throw new Error(`GET /apply failed: ${pageResponse.status}`);

  const html = await pageResponse.text();
  const actionFields = readActionFields(html);
  if (actionFields.length === 0) {
    throw new Error("No progressive-enhancement action fields found on /apply");
  }

  const form = new FormData();
  for (const field of actionFields) form.set(field.name, field.value);

  const email = `qa-${Date.now()}@example.com`;
  const answers = {
    name: "QA Applicant",
    email,
    company: "QA Testing Ltd",
    website: "https://qa.example.com",
    whatYouSell: "Fractional operations support for B2B software companies.",
    revenueRange: "£250k – £1m",
    contentProcess:
      "I write posts myself when I have time, and a freelancer turns them into carousels.",
    peopleInvolved: "2 – 3",
    publishCadence: "Weekly",
    biggestBottleneck: "Me. Nothing moves unless I write it first.",
    founderHours: "5 – 10 hours",
    successLooksLike: "Publishing consistently without being the bottleneck.",
    urgency: "Yes — this is a priority now",
  };
  for (const [key, value] of Object.entries(answers)) form.set(key, value);
  form.append("platforms", "LinkedIn");
  form.append("platforms", "YouTube");

  const response = await fetch(`${BASE}/apply`, {
    method: "POST",
    body: form,
    redirect: "manual",
  });

  console.log("submitted as:", email);
  console.log("status:", response.status);
  return { email, status: response.status };
}

main()
  .then((result) => {
    if (result.status >= 400) process.exit(1);
  })
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
