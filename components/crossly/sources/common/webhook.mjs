import crypto from "node:crypto";
import crossly from "../../crossly.app.mjs";

const TOLERANCE_SECONDS = 300;

/**
 * Verify `Crossly-Signature: t=<unix>,v1=<hex HMAC-SHA256(secret, "t.rawBody")>`.
 * Exported for tests. Returns true only for a fresh, matching signature.
 */
export function verifySignature(rawBody, header, secret, nowSeconds = Math.floor(Date.now() / 1000)) {
  if (!header || !secret || typeof rawBody !== "string") return false;
  let t = null;
  let v1 = null;
  for (const part of String(header).split(",")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const key = part.slice(0, eq).trim();
    const value = part.slice(eq + 1).trim();
    if (key === "t" && Number.isFinite(Number(value))) t = Number(value);
    if (key === "v1") v1 = value;
  }
  if (t === null || !v1) return false;
  if (Math.abs(nowSeconds - t) > TOLERANCE_SECONDS) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${t}.${rawBody}`)
    .digest("hex");
  const a = Buffer.from(v1, "hex");
  const b = Buffer.from(expected, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function header(headers = {}, name) {
  const lower = name.toLowerCase();
  for (const [
    k,
    v,
  ] of Object.entries(headers)) {
    if (k.toLowerCase() === lower) return Array.isArray(v)
      ? v[0]
      : v;
  }
  return undefined;
}

export default {
  props: {
    crossly,
    http: {
      type: "$.interface.http",
      customResponse: true,
    },
    db: "$.service.db",
  },
  hooks: {
    async activate() {
      const webhook = await this.crossly.createWebhook({
        data: {
          url: this.http.endpoint,
          events: [
            this.getEvent(),
          ],
          description: `Pipedream source: ${this.getEvent()}`,
        },
      });
      this._setWebhookId(webhook.id);
      this._setSecret(webhook.secret);
    },
    async deactivate() {
      const id = this._getWebhookId();
      if (id) {
        await this.crossly.deleteWebhook({
          webhookId: id,
        });
      }
      this._setWebhookId(null);
      this._setSecret(null);
    },
  },
  methods: {
    _getWebhookId() {
      return this.db.get("webhookId");
    },
    _setWebhookId(id) {
      this.db.set("webhookId", id);
    },
    _getSecret() {
      return this.db.get("secret");
    },
    _setSecret(secret) {
      this.db.set("secret", secret);
    },
    getEvent() {
      throw new Error("getEvent is not implemented");
    },
    getSummary(event) {
      return `${event.type} ${event.id}`;
    },
    generateMeta(event) {
      return {
        id: event.id,
        summary: this.getSummary(event),
        ts: Date.parse(event.created) || Date.now(),
      };
    },
  },
  async run(event) {
    const raw = typeof event.bodyRaw === "string"
      ? event.bodyRaw
      : JSON.stringify(event.body);
    const ok = verifySignature(raw, header(event.headers, "crossly-signature"), this._getSecret());
    if (!ok) {
      this.http.respond({
        status: 401,
        body: "invalid signature",
      });
      return;
    }
    this.http.respond({
      status: 200,
      body: "ok",
    });
    const body = typeof event.body === "object" && event.body
      ? event.body
      : JSON.parse(raw);
    // test.ping reaches every endpoint; only emit the subscribed event.
    if (body.type !== this.getEvent()) return;
    this.$emit(body, this.generateMeta(body));
  },
};
