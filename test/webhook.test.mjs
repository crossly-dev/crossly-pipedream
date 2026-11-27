import { test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import common, { verifySignature } from "../components/crossly/sources/common/webhook.mjs";
import newSale from "../components/crossly/sources/new-sale-detected/new-sale-detected.mjs";
import app from "../components/crossly/crossly.app.mjs";

const SECRET = "whsec_test";
const sign = (body, t, secret = SECRET) =>
  `t=${t},v1=${crypto.createHmac("sha256", secret).update(`${t}.${body}`)
    .digest("hex")}`;
const now = 1748192522;

test("accepts a fresh valid signature", () => {
  const body = JSON.stringify({
    id: "e1",
    type: "sale.detected",
  });
  assert.equal(verifySignature(body, sign(body, now), SECRET, now), true);
});

test("rejects tampered body, wrong secret, stale timestamp, malformed header", () => {
  const body = JSON.stringify({
    a: 1,
  });
  assert.equal(verifySignature(JSON.stringify({
    a: 2,
  }), sign(body, now), SECRET, now), false);
  assert.equal(verifySignature(body, sign(body, now, "other"), SECRET, now), false);
  assert.equal(verifySignature(body, sign(body, now - 301), SECRET, now), false);
  assert.equal(verifySignature(body, "garbage", SECRET, now), false);
  assert.equal(verifySignature(body, undefined, SECRET, now), false);
  assert.equal(verifySignature(body, sign(body, now), undefined, now), false);
});

function harness(component) {
  const db = new Map();
  const emitted = [];
  const responses = [];
  const calls = [];
  const ctx = {
    ...component.methods,
    db: {
      get: (k) => db.get(k),
      set: (k, v) => db.set(k, v),
    },
    http: {
      endpoint: "https://example.m.pipedream.net",
      respond: (r) => responses.push(r),
    },
    crossly: {
      createWebhook: async (opts) => {
        calls.push([
          "create",
          opts,
        ]);
        return {
          id: "wh_1",
          secret: SECRET,
        };
      },
      deleteWebhook: async (opts) => {
        calls.push([
          "delete",
          opts,
        ]);
        return {
          ok: true,
        };
      },
    },
    $emit: (body, meta) => emitted.push({
      body,
      meta,
    }),
  };
  return {
    ctx,
    db,
    emitted,
    responses,
    calls,
  };
}

test("activate registers a REST hook for the event; deactivate deletes it", async () => {
  const h = harness(newSale);
  await newSale.hooks.activate.call(h.ctx);
  assert.deepEqual(h.calls[0][1].data.events, [
    "sale.detected",
  ]);
  assert.equal(h.calls[0][1].data.url, "https://example.m.pipedream.net");
  assert.equal(h.db.get("secret"), SECRET);
  await newSale.hooks.deactivate.call(h.ctx);
  assert.deepEqual(h.calls[1], [
    "delete",
    {
      webhookId: "wh_1",
    },
  ]);
  assert.equal(h.db.get("webhookId"), null);
});

test("run emits verified events with the envelope id for dedupe, ignores others", async () => {
  const h = harness(newSale);
  h.db.set("secret", SECRET);
  const t = Math.floor(Date.now() / 1000);
  const raw = JSON.stringify(newSale.sampleEmit);
  await newSale.run.call(h.ctx, {
    bodyRaw: raw,
    body: JSON.parse(raw),
    headers: {
      "crossly-signature": sign(raw, t),
    },
  });
  assert.equal(h.responses[0].status, 200);
  assert.equal(h.emitted.length, 1);
  assert.equal(h.emitted[0].meta.id, newSale.sampleEmit.id);
  assert.match(h.emitted[0].meta.summary, /poshmark/);

  const ping = JSON.stringify({
    id: "p",
    type: "test.ping",
    created: new Date().toISOString(),
    data: {},
  });
  await newSale.run.call(h.ctx, {
    bodyRaw: ping,
    body: JSON.parse(ping),
    headers: {
      "Crossly-Signature": sign(ping, t),
    },
  });
  assert.equal(h.emitted.length, 1);

  await newSale.run.call(h.ctx, {
    bodyRaw: raw,
    body: JSON.parse(raw),
    headers: {
      "crossly-signature": sign(raw, t, "nope"),
    },
  });
  assert.equal(h.responses.at(-1).status, 401);
  assert.equal(h.emitted.length, 1);
});

test("common webhook base has no event of its own", () => {
  assert.throws(() => common.methods.getEvent());
});

test("paginate stops on a short page and honours max", async () => {
  const pages = [
    Array.from({
      length: 100,
    }, (_, i) => ({
      i,
    })),
    [
      {
        i: 100,
      },
    ],
  ];
  const seen = [];
  const fn = async ({ params }) => {
    seen.push(params.page);
    return {
      data: pages[params.page - 1] || [],
    };
  };
  const rows = [];
  for await (const r of app.methods.paginate({
    fn,
  })) rows.push(r);
  assert.equal(rows.length, 101);
  assert.deepEqual(seen, [
    1,
    2,
  ]);
  const capped = [];
  for await (const r of app.methods.paginate({
    fn,
    max: 5,
  })) capped.push(r);
  assert.equal(capped.length, 5);
});
