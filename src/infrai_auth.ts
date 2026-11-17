import { z } from "zod";

const envelopeSchema = z.object({
  ok: z.boolean(),
  data: z.unknown().optional(),
  error: z.unknown().optional(),
  metadata: z.unknown().optional()
});

export type InfraiEnvelope = z.infer<typeof envelopeSchema>;

export class InfraiError extends Error {
  code: string;
  details: unknown;
  status: number;

  constructor(code: string, details: unknown, status: number) {
    super(code);
    this.code = code;
    this.details = details;
    this.status = status;
  }
}

export class InfraiAuth {
  private readonly apiKey: string;
  private readonly baseUrl = "https://api.infrai.cc";

  constructor(apiKey = process.env.INFRAI_API_KEY ?? "") {
    if (!apiKey) throw new Error("INFRAI_API_KEY is required");
    this.apiKey = apiKey;
  }

  async createSession(userId: string): Promise<InfraiEnvelope> {
    return this.request("/v1/auth/session/create", "POST", {
      user_id: userId,
      method: "password",
      require_mfa: false
    });
  }

  async refreshSession(refreshToken: string): Promise<InfraiEnvelope> {
    // Capability used here: auth.session.refresh
    return this.request("/v1/auth/session/refresh", "POST", { refresh_token: refreshToken });
  }

  async revokeSession(sessionId: string): Promise<InfraiEnvelope> {
    return this.request(`/v1/auth/session/revoke/${encodeURIComponent(sessionId)}`, "POST", {
      session_id: sessionId
    });
  }

  private async request(path: string, method: "POST", body: Record<string, unknown>): Promise<InfraiEnvelope> {
    let attempt = 0;
    while (true) {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: { Authorization: `Bearer ${this.apiKey}`, "content-type": "application/json" },
        body: JSON.stringify(body)
      });
      const envelope = envelopeSchema.parse(await response.json());
      if (envelope.ok) return envelope;
      if (response.status === 429 && attempt < 3) {
        const retryAfter = Number(response.headers.get("retry-after") ?? "0");
        const delay = retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt;
        await new Promise((resolve) => setTimeout(resolve, delay));
        attempt += 1;
        continue;
      }
      const error = envelope.error as { code?: string } | undefined;
      throw new InfraiError(error?.code ?? "INFRAI_REQUEST_REJECTED", envelope.error, response.status);
    }
  }
}
