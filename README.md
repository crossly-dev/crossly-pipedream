# Crossly for Pipedream

[![CI](https://github.com/crossly-dev/crossly-pipedream/actions/workflows/ci.yml/badge.svg)](https://github.com/crossly-dev/crossly-pipedream/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/crossly-dev/crossly-pipedream)](https://github.com/crossly-dev/crossly-pipedream/releases)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

These are [Pipedream](https://pipedream.com) components for [Crossly](https://crossly.net), the multi-marketplace crossposting platform for resellers: list once, sell on eBay, Poshmark, Mercari, Depop and more. A Pipedream workflow can start the moment a sale lands, an offer comes in or stock runs out, and any workflow can crosspost, reprice, restock and ship.

- **21 instant sources.** When you deploy a source, it registers a Crossly webhook (`POST /v1/webhooks`). When you remove the source, it deletes the webhook (REST hooks). Before anything is emitted, the source checks each delivery's `Crossly-Signature`: HMAC-SHA256 over `t.rawBody`, with a 5-minute tolerance. It dedupes on the event `id`.
- **18 actions** for listings, inventory, orders, sales and offers. They page through results with `page`/`limit`. On a `429` they wait for the time given in `Retry-After`, then retry.
- **Registry layout.** The components use the [Pipedream registry](https://github.com/PipedreamHQ/pipedream/tree/master/components) layout (`components/crossly/…`), so they can be submitted there as they are.

Every endpoint, field and event name comes from the public spec [`https://crossly.net/openapi/seller.json`](https://crossly.net/openapi/seller.json) and the [webhook event catalog](https://crossly.net/docs/api-webhooks#event-catalog).

## Authentication

Crossly uses a **Personal Access Token** (`crossly_pat_…`) sent as `Authorization: Bearer <token>`. To create one, go to **Settings → API & webhooks** in Crossly. Give it the scopes your workflows need:

| Scope | Needed for |
| --- | --- |
| `listings:read` / `listings:write` | listing actions |
| `inventory:read` / `inventory:write` | inventory actions, Set Stock |
| `orders:read` / `orders:write` | order actions, Add Tracking |
| `sales:read` | List Sales |
| `webhooks:read` / `webhooks:write` | **every source** (each one registers its own webhook) |

The components read the token from `this.$auth.api_key`. That is the auth field the `crossly` app will have once it is in the registry (see [Submitting to the Pipedream registry](#submitting-to-the-pipedream-registry)).

## Use it now (before it is in the registry)

The Crossly app is not in Pipedream's public registry yet. Until it is, publish the components to **your own workspace** with the [Pipedream CLI](https://pipedream.com/docs/cli/install):

```bash
git clone https://github.com/crossly-dev/crossly-pipedream && cd crossly-pipedream
cd components/crossly && npm install --omit=dev && cd ../..
pd login
pd publish components/crossly/actions/create-listing/create-listing.mjs
pd deploy  components/crossly/sources/new-sale-detected/new-sale-detected.mjs
```

The components need a `crossly` app connection to supply `$auth.api_key`. Until the official app exists, use one of these:

1. **Custom app.** Define a [custom app](https://pipedream.com/docs/apps/connected-accounts) named `crossly` in your workspace with an `api_key` field, and connect it with your PAT. The components then work unchanged.
2. **Node.js code step.** In a workflow, add a **Node.js** step and paste in an action's `run` body. Replace `this.$auth.api_key` with `process.env.CROSSLY_PAT`, and store the token in a [workflow environment variable](https://pipedream.com/docs/workflows/environment-variables) named `CROSSLY_PAT`.

Every [release](https://github.com/crossly-dev/crossly-pipedream/releases) also comes with `crossly-pipedream-vX.Y.Z.zip` (the `components/crossly` folder) and a signed build-provenance attestation:

```bash
gh attestation verify crossly-pipedream-v0.1.0.zip -R crossly-dev/crossly-pipedream
```

## Actions

| Action | Key | Method | Path | operationId | Scope |
| --- | --- | --- | --- | --- | --- |
| Get Account | `crossly-get-account` | GET | `/v1/me` | `getMe` | — |
| List Listings | `crossly-list-listings` | GET | `/v1/listings` | `listListings` | `listings:read` |
| Get Listing | `crossly-get-listing` | GET | `/v1/listings/{id}` | `getListing` | `listings:read` |
| Create Listing (Crosspost) | `crossly-create-listing` | POST | `/v1/listings` | `createListing` | `listings:write` |
| Update Listing | `crossly-update-listing` | PATCH | `/v1/listings/{id}` | `updateListing` | `listings:write` |
| Delist Listing | `crossly-delist-listing` | DELETE | `/v1/listings/{id}` | `deleteListing` | `listings:write` |
| List Inventory | `crossly-list-inventory` | GET | `/v1/inventory` | `listInventory` | `inventory:read` |
| Get Inventory Item | `crossly-get-inventory-item` | GET | `/v1/inventory/{id}` | `getInventory` | `inventory:read` |
| Create Inventory Item | `crossly-create-inventory-item` | POST | `/v1/inventory` | `createInventory` | `inventory:write` |
| Update Inventory Item | `crossly-update-inventory-item` | PATCH | `/v1/inventory/{id}` | `updateInventory` | `inventory:write` |
| Set Stock | `crossly-set-stock` | POST | `/v1/inventory/bulk-quantity` | `createInventoryBulkQuantity` | `inventory:write` |
| List Orders | `crossly-list-orders` | GET | `/v1/orders` | `listOrders` | `orders:read` |
| Get Order | `crossly-get-order` | GET | `/v1/orders/{id}` | `getOrder` | `orders:read` |
| Update Order | `crossly-update-order` | PATCH | `/v1/orders/{id}` | `updateOrder` | `orders:write` |
| Add Tracking | `crossly-add-tracking` | POST | `/v1/orders/{id}/tracking` | `createOrderTracking` | `orders:write` |
| List Sales | `crossly-list-sales` | GET | `/v1/sales` | `listSales` | `sales:read` |
| List Offers | `crossly-list-offers` | GET | `/v1/offers` | `getOffer` | — |
| Respond to Offer | `crossly-respond-to-offer` | POST | `/v1/offers/{id}/respond` | `createOfferRespond` | — |

Notes on the actions:

- **Create Listing** sends `{ platforms, inventoryItemId?, data: { title, description, price, images, … }, createInventoryItem?, clientReferenceId? }`. Set `clientReferenceId` so retries are safe: a repeat with the same reference returns the existing listing.
- **Update Listing** sends `{ changes, platforms? }` and pushes the edit to every live marketplace copy. **Update Inventory Item** does not push anything to listings.
- **Set Stock** calls `POST /v1/inventory/bulk-quantity` with `{ ids, mode: set|increase|decrease, value }`. The value is the *available* stock. Live listings follow, and anything that reaches 0 is delisted.
- **List Offers** and **Respond to Offer** only cover offers on **Crossly marketplace** listings. For offers made on other marketplaces, use the **New Offer Received** source.

## Sources

| Source | Key | Crossly event | Fires when |
| --- | --- | --- | --- |
| New Sale Detected (Instant) | `crossly-new-sale-detected` | `sale.detected` | A new sale was detected on any platform. |
| New Order Created (Instant) | `crossly-new-order-created` | `order.created` | An order was created from a sale. |
| Order Buyer Address Available (Instant) | `crossly-order-address-available` | `order.address_available` | The buyer's shipping address arrived after the order was created: name, address and phone, ready to ship. |
| Order Shipped (Instant) | `crossly-order-shipped` | `order.shipped` | The order shipped: marked shipped, or the carrier's first in-network scan. Once per order. |
| Order Delivered (Instant) | `crossly-order-delivered` | `order.delivered` | The carrier reports the package delivered. |
| Order Cancelled (Instant) | `crossly-order-cancelled` | `order.cancelled` | An order was cancelled before it shipped. |
| Order Refunded (Instant) | `crossly-order-refunded` | `order.refunded` | An order was refunded, in full or in part: the amount, the running total and whether anything is left. |
| Refund Issued (Instant) | `crossly-refund-issued` | `refund.issued` | A refund was issued on a platform. |
| Return Requested (Instant) | `crossly-return-requested` | `return.requested` | A Crossly-marketplace buyer asked to return an order: the reason, their note and photos. |
| Return Resolved (Instant) | `crossly-return-resolved` | `return.resolved` | A return request closed: refunded in full or in part, no refund, or withdrawn by the buyer. |
| New Listing Published (Instant) | `crossly-new-listing-created` | `listing.created` | A listing was published on a platform. |
| Listing Price Changed (Instant) | `crossly-listing-price-changed` | `listing.price_changed` | A listing price changed, from any path: editor, repricer, API or bulk edit. |
| Listing Delisted (Instant) | `crossly-listing-delisted` | `listing.delisted` | A platform listing came down, on request or reported gone by the marketplace. |
| Stock Changed (Instant) | `crossly-stock-changed` | `inventory.quantity_changed` | An item's stock changed, from any path (a sale, a cancellation, a return, an edit, the API): the counts after the change, and soldOut when none are left. |
| New Offer Received (Instant) | `crossly-new-offer-received` | `offer.received` | A buyer made an offer. |
| Offer Accepted (Instant) | `crossly-offer-accepted` | `offer.accepted` | An offer was accepted, by you or an auto-respond rule. |
| Offer Declined (Instant) | `crossly-offer-declined` | `offer.declined` | An offer was declined. |
| Offer Countered (Instant) | `crossly-offer-countered` | `offer.countered` | An offer was countered. |
| New Buyer Message (Instant) | `crossly-new-message-received` | `message.received` | A buyer sent you a message. |
| Marketplace Connection Lost (Instant) | `crossly-connection-lost` | `connection.disconnected` | A platform session died; syncing for it has stopped until you reconnect. |
| Automation Failed (Instant) | `crossly-automation-failed` | `automation.failed` | An automation run failed. |

Each source emits the full webhook envelope, `{ id, type, created, data }`. The [payload reference](https://crossly.net/docs/api-webhooks#payloads) documents `data` for each event, and every source folder has a sample in `test-event.mjs`. Crossly sends `test.ping` to every endpoint, so sources acknowledge it but do not emit it. To get a real-shaped sample, call `POST /v1/webhooks/{id}/test` with `{ "event": "<name>" }`.

`npm run generate` builds the source files from `scripts/events.json`. CI fails if the committed files are out of date.

## Development

Requires Node 20 or later.

```bash
npm install
npm run ci        # node --check + eslint + shape validation + unit tests
```

`scripts/validate.mjs` imports every component and checks it against the registry rules:

- `crossly-` key prefix, and keys are unique
- semver `version`
- a name, and a description that links to the docs
- the right `type`, and a `crossly` app prop
- every `propDefinition` resolves
- actions export `$summary`
- sources have `dedupe`, hooks and `sampleEmit`

It also checks that every operation in `scripts/operations.json` has an app method and an action.

### Releasing

1. Bump `components/crossly/package.json` and the `version` of every component that changed, and update `CHANGELOG.md`.
2. Tag `vX.Y.Z` and push the tag. The release workflow then:
   - runs CI
   - zips `components/crossly`
   - attests build provenance (`actions/attest-build-provenance`)
   - creates the GitHub Release
3. Optional: to also `pd publish` every component to a workspace, set the repo variable `PD_PUBLISH` to `true` and add a `PD_API_KEY` secret.

## Submitting to the Pipedream registry

This is a one-time step a person has to do:

1. **Request the app.** Go to <https://pipedream.com/requests> and request a new `crossly` app with **API key** auth:
   - field `api_key`, labelled *Personal Access Token*
   - sent as `Authorization: Bearer {{api_key}}`
   - test request: `GET https://crossly.net/api/v1/me`

   Pipedream's team creates the app and its slug.
2. **Open a PR.** Fork [PipedreamHQ/pipedream](https://github.com/PipedreamHQ/pipedream) and copy this repo's `components/crossly/` to `components/crossly/` there. Run their `pnpm install` and lint (the registry CI runs its own eslint config and component checks). Then open a PR that follows the [component guidelines](https://pipedream.com/docs/components/contributing/guidelines). Pipedream's reviewers test the components and may ask for changes. Once the PR is merged, the components are published under the `crossly` app.
3. After that, send each version bump to the registry as a PR. This repo stays the source.

## Links

- API reference: <https://crossly.net/docs> · OpenAPI: <https://crossly.net/openapi/seller.json>
- Webhooks and the event catalog: <https://crossly.net/docs/api-webhooks>
- TypeScript SDK: [`@crossly/sdk`](https://github.com/crossly-dev/crossly-sdk)
- Security: report vulnerabilities privately with GitHub's **Report a vulnerability** button on this repo.

## License

[MIT](LICENSE)
