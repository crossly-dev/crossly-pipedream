import { axios } from "@pipedream/platform";

// Marketplace ids the Crossly API accepts (seller SDK `Platform` type + the
// taxonomy enum in https://crossly.net/openapi/seller.json).
export const PLATFORMS = [
  "poshmark",
  "mercari",
  "depop",
  "grailed",
  "vinted",
  "whatnot",
  "vestiaire",
  "offerup",
  "facebook",
  "ebay",
  "etsy",
  "shopify",
  "amazon",
  "walmart",
  "curtsy",
];

const MAX_LIMIT = 100;
const MAX_429_RETRIES = 3;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default {
  type: "app",
  app: "crossly",
  propDefinitions: {
    listingId: {
      type: "string",
      label: "Listing ID",
      description: "The UUID of a Crossly listing.",
      async options({ page }) {
        const { data = [] } = await this.listListings({
          params: {
            page: page + 1,
            limit: MAX_LIMIT,
          },
        });
        return data.map((l) => ({
          label: `${l.title || l.name || l.id}${l.sku
            ? ` (${l.sku})`
            : ""}`,
          value: l.id,
        }));
      },
    },
    inventoryItemId: {
      type: "string",
      label: "Inventory Item ID",
      description: "The UUID of a Crossly inventory item.",
      async options({ page }) {
        const { data = [] } = await this.listInventory({
          params: {
            page: page + 1,
            limit: MAX_LIMIT,
          },
        });
        return data.map((i) => ({
          label: `${i.defaultTitle || i.id}${i.sku
            ? ` (${i.sku})`
            : ""}`,
          value: i.id,
        }));
      },
    },
    orderId: {
      type: "string",
      label: "Order ID",
      description: "The UUID of a Crossly order.",
      async options({ page }) {
        const { data = [] } = await this.listOrders({
          params: {
            page: page + 1,
            limit: MAX_LIMIT,
          },
        });
        return data.map((o) => ({
          label: `${o.platform} ${o.platformOrderId || o.id} — ${o.status}`,
          value: o.id,
        }));
      },
    },
    offerId: {
      type: "string",
      label: "Offer ID",
      description: "The UUID of a buyer offer on a Crossly marketplace listing.",
      async options() {
        const { offers = [] } = await this.listOffers({
          params: {
            status: "pending",
            limit: MAX_LIMIT,
          },
        });
        return offers.map((o) => ({
          label: `${(o.amountCents / 100).toFixed(2)} — ${o.status}${o.isBundle
            ? " (bundle)"
            : ""}`,
          value: o.id,
        }));
      },
    },
    platforms: {
      type: "string[]",
      label: "Platforms",
      description: "Marketplace ids, e.g. `poshmark`, `mercari`, `ebay`.",
      options: PLATFORMS,
    },
    platform: {
      type: "string",
      label: "Platform",
      description: "Filter to one marketplace id, e.g. `poshmark`.",
      options: PLATFORMS,
      optional: true,
    },
    updatedSince: {
      type: "string",
      label: "Updated Since",
      description: "Only rows created or changed at or after this ISO 8601 time.",
      optional: true,
    },
    maxResults: {
      type: "integer",
      label: "Max Results",
      description: "Stop after this many records (pages of 100 are fetched until then).",
      optional: true,
      default: 100,
      min: 1,
    },
  },
  methods: {
    _baseUrl() {
      return "https://crossly.net/api";
    },
    _headers(headers = {}) {
      return {
        "Authorization": `Bearer ${this.$auth.api_key}`,
        "Accept": "application/json",
        "User-Agent": "crossly-pipedream/0.1.0",
        ...headers,
      };
    },
    async _makeRequest({
      $ = this, path, headers, ...opts
    }) {
      for (let attempt = 0; ; attempt++) {
        try {
          return await axios($, {
            url: `${this._baseUrl()}${path}`,
            headers: this._headers(headers),
            ...opts,
          });
        } catch (err) {
          const status = err?.response?.status;
          if (status === 429 && attempt < MAX_429_RETRIES) {
            const retryAfter = Number(err.response.headers?.["retry-after"]) || 5;
            await sleep(retryAfter * 1000);
            continue;
          }
          const body = err?.response?.data;
          if (body?.error?.message) {
            const e = new Error(`Crossly API ${status} ${body.error.code}: ${body.error.message}${body.correlationId
              ? ` (correlationId ${body.correlationId})`
              : ""}`);
            e.response = err.response;
            throw e;
          }
          throw err;
        }
      }
    },
    /**
     * Walks a page/limit list endpoint (`{ data, pagination }`), yielding rows.
     * Stops when a page comes back shorter than `limit` (some lists omit totals).
     */
    async *paginate({
      fn, params = {}, max,
    }) {
      let page = 1;
      let count = 0;
      const limit = MAX_LIMIT;
      while (true) {
        const { data = [] } = await fn({
          params: {
            ...params,
            page,
            limit,
          },
        });
        for (const row of data) {
          yield row;
          if (max && ++count >= max) return;
        }
        if (data.length < limit) return;
        page++;
      }
    },
    getMe(opts = {}) {
      return this._makeRequest({
        path: "/v1/me",
        ...opts,
      });
    },
    listListings(opts = {}) {
      return this._makeRequest({
        path: "/v1/listings",
        ...opts,
      });
    },
    getListing({
      listingId, ...opts
    }) {
      return this._makeRequest({
        path: `/v1/listings/${encodeURIComponent(listingId)}`,
        ...opts,
      });
    },
    createListing({
      idempotencyKey, ...opts
    } = {}) {
      return this._makeRequest({
        method: "POST",
        path: "/v1/listings",
        headers: idempotencyKey
          ? {
            "Idempotency-Key": idempotencyKey,
          }
          : {},
        ...opts,
      });
    },
    updateListing({
      listingId, ...opts
    }) {
      return this._makeRequest({
        method: "PATCH",
        path: `/v1/listings/${encodeURIComponent(listingId)}`,
        ...opts,
      });
    },
    delistListing({
      listingId, ...opts
    }) {
      return this._makeRequest({
        method: "DELETE",
        path: `/v1/listings/${encodeURIComponent(listingId)}`,
        ...opts,
      });
    },
    listInventory(opts = {}) {
      return this._makeRequest({
        path: "/v1/inventory",
        ...opts,
      });
    },
    getInventoryItem({
      inventoryItemId, ...opts
    }) {
      return this._makeRequest({
        path: `/v1/inventory/${encodeURIComponent(inventoryItemId)}`,
        ...opts,
      });
    },
    createInventoryItem({
      idempotencyKey, ...opts
    } = {}) {
      return this._makeRequest({
        method: "POST",
        path: "/v1/inventory",
        headers: idempotencyKey
          ? {
            "Idempotency-Key": idempotencyKey,
          }
          : {},
        ...opts,
      });
    },
    updateInventoryItem({
      inventoryItemId, ...opts
    }) {
      return this._makeRequest({
        method: "PATCH",
        path: `/v1/inventory/${encodeURIComponent(inventoryItemId)}`,
        ...opts,
      });
    },
    setStock(opts = {}) {
      return this._makeRequest({
        method: "POST",
        path: "/v1/inventory/bulk-quantity",
        ...opts,
      });
    },
    listOrders(opts = {}) {
      return this._makeRequest({
        path: "/v1/orders",
        ...opts,
      });
    },
    getOrder({
      orderId, ...opts
    }) {
      return this._makeRequest({
        path: `/v1/orders/${encodeURIComponent(orderId)}`,
        ...opts,
      });
    },
    updateOrder({
      orderId, ...opts
    }) {
      return this._makeRequest({
        method: "PATCH",
        path: `/v1/orders/${encodeURIComponent(orderId)}`,
        ...opts,
      });
    },
    addTracking({
      orderId, ...opts
    }) {
      return this._makeRequest({
        method: "POST",
        path: `/v1/orders/${encodeURIComponent(orderId)}/tracking`,
        ...opts,
      });
    },
    listSales(opts = {}) {
      return this._makeRequest({
        path: "/v1/sales",
        ...opts,
      });
    },
    listOffers(opts = {}) {
      return this._makeRequest({
        path: "/v1/offers",
        ...opts,
      });
    },
    respondToOffer({
      offerId, ...opts
    }) {
      return this._makeRequest({
        method: "POST",
        path: `/v1/offers/${encodeURIComponent(offerId)}/respond`,
        ...opts,
      });
    },
    listWebhooks(opts = {}) {
      return this._makeRequest({
        path: "/v1/webhooks",
        ...opts,
      });
    },
    createWebhook(opts = {}) {
      return this._makeRequest({
        method: "POST",
        path: "/v1/webhooks",
        ...opts,
      });
    },
    deleteWebhook({
      webhookId, ...opts
    }) {
      return this._makeRequest({
        method: "DELETE",
        path: `/v1/webhooks/${encodeURIComponent(webhookId)}`,
        ...opts,
      });
    },
  },
};
