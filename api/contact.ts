type ContactPayload = {
  name: string;
  email: string;
  company: string;
  message: string;
  _honey: string;
  submissionId: string;
};

type ValidationResult =
  | { ok: true; value: ContactPayload }
  | { ok: false; error: string; bot?: boolean };

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const MAX_BODY_BYTES = 12_000;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_MAX_ENTRIES = 500;
const RESEND_TIMEOUT_MS = 8_000;
const rateLimits = new Map<string, RateLimitEntry>();

const responseHeaders = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
};

function json(data: Record<string, unknown>, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...responseHeaders, ...headers },
  });
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.replaceAll("\0", "").trim() : "";
}

export function validateContactPayload(input: unknown): ValidationResult {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, error: "Send the form again with all required fields." };
  }

  const raw = input as Record<string, unknown>;
  const payload: ContactPayload = {
    name: cleanText(raw.name),
    email: cleanText(raw.email).toLowerCase(),
    company: cleanText(raw.company),
    message: cleanText(raw.message),
    _honey: cleanText(raw._honey),
    submissionId: cleanText(raw.submissionId),
  };

  if (payload._honey) return { ok: false, error: "", bot: true };

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(payload.submissionId)) {
    return { ok: false, error: "Refresh the form before sending." };
  }
  if (payload.name.length < 2 || payload.name.length > 120) {
    return { ok: false, error: "Enter your name using 2 to 120 characters." };
  }
  if (payload.email.length > 200 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    return { ok: false, error: "Enter a valid email address." };
  }
  if (payload.company.length > 160) {
    return { ok: false, error: "Keep the company name under 160 characters." };
  }
  if (payload.message.length < 20 || payload.message.length > 2_000) {
    return { ok: false, error: "Describe the handoff in 20 to 2,000 characters." };
  }

  return { ok: true, value: payload };
}

function rateLimit(request: Request, now = Date.now()) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const key = forwarded || request.headers.get("x-real-ip") || "unknown";
  const current = rateLimits.get(key);

  if (current && current.resetAt > now) {
    current.count += 1;
    if (current.count <= RATE_LIMIT_MAX) return { allowed: true, retryAfter: 0 };
    return { allowed: false, retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
  }
  if (current) rateLimits.delete(key);

  if (rateLimits.size >= RATE_LIMIT_MAX_ENTRIES) {
    for (const [entryKey, entry] of rateLimits) {
      if (entry.resetAt <= now) rateLimits.delete(entryKey);
    }
  }
  while (rateLimits.size >= RATE_LIMIT_MAX_ENTRIES) {
    const oldestKey = rateLimits.keys().next().value;
    if (oldestKey === undefined) break;
    rateLimits.delete(oldestKey);
  }

  rateLimits.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
  return { allowed: true, retryAfter: 0 };
}

function log(level: "info" | "error", message: string, request: Request, started: number, extra: Record<string, unknown> = {}) {
  const entry = {
    level,
    message,
    route: "/api/contact",
    requestId: request.headers.get("x-vercel-id"),
    durationMs: Date.now() - started,
    ...extra,
  };
  const output = JSON.stringify(entry);
  if (level === "error") console.error(output);
  else console.log(output);
}

export default {
  async fetch(request: Request) {
    const started = Date.now();

    if (request.method !== "POST") {
      return json({ error: "Method not allowed." }, 405, { Allow: "POST" });
    }

    const origin = request.headers.get("origin");
    const requestOrigin = new URL(request.url).origin;
    if (origin && origin !== requestOrigin) {
      log("error", "contact_origin_rejected", request, started);
      return json({ error: "This request must come from the portfolio site." }, 403);
    }

    const contentType = request.headers.get("content-type") || "";
    const declaredSize = Number(request.headers.get("content-length") || 0);
    if (!contentType.includes("application/json")) {
      return json({ error: "The request format is not supported." }, 415);
    }
    if (declaredSize > MAX_BODY_BYTES) return json({ error: "The request is too large." }, 413);

    let rawBody = "";
    const reader = request.body?.getReader();
    if (reader) {
      const decoder = new TextDecoder();
      let receivedBytes = 0;
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          receivedBytes += value.byteLength;
          if (receivedBytes > MAX_BODY_BYTES) {
            await reader.cancel().catch(() => undefined);
            return json({ error: "The request is too large." }, 413);
          }
          rawBody += decoder.decode(value, { stream: true });
        }
        rawBody += decoder.decode();
      } catch {
        return json({ error: "The request body could not be read." }, 400);
      }
    }

    let input: unknown;
    try {
      input = JSON.parse(rawBody);
    } catch {
      return json({ error: "The request body is not valid JSON." }, 400);
    }

    const validation = validateContactPayload(input);
    if ("error" in validation) {
      if (validation.bot) return json({ ok: true });
      return json({ error: validation.error }, 400);
    }

    const limit = rateLimit(request);
    if (!limit.allowed) {
      log("error", "contact_rate_limited", request, started);
      return json(
        { error: "Too many requests were sent. Wait a few minutes and try again." },
        429,
        { "Retry-After": String(limit.retryAfter) },
      );
    }

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.CONTACT_FROM_EMAIL;
    const to = process.env.CONTACT_TO_EMAIL || "danilo@neurosparkmarketing.com";
    if (!apiKey || !from) {
      log("error", "contact_email_not_configured", request, started);
      return json({ error: "Contact email is temporarily unavailable." }, 503);
    }

    const { name, email, company, message, submissionId } = validation.value;
    const emailText = [
      "New system review request from daniloojeda.com",
      "",
      `Name: ${name}`,
      `Email: ${email}`,
      `Company: ${company || "Not provided"}`,
      "",
      "What should the system fix first?",
      message,
    ].join("\n");

    try {
      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `portfolio-contact-${submissionId}`,
        },
        signal: AbortSignal.timeout(RESEND_TIMEOUT_MS),
        body: JSON.stringify({
          from,
          to: [to],
          reply_to: email,
          subject: "New system review request from daniloojeda.com",
          text: emailText,
        }),
      });

      if (!resendResponse.ok) {
        log("error", "contact_email_provider_failed", request, started, { providerStatus: resendResponse.status });
        return json({ error: "Contact email is temporarily unavailable." }, 502);
      }

      log("info", "contact_email_accepted", request, started);
      return json({ ok: true });
    } catch (error) {
      log("error", "contact_email_request_failed", request, started, {
        errorType: error instanceof Error ? error.name : "UnknownError",
      });
      return json({ error: "Contact email is temporarily unavailable." }, 502);
    }
  },
};
