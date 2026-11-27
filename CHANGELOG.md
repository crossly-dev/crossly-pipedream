# Changelog

This file follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/).

## [0.1.0] - 2026-11-27

### Added

- `crossly` app (`components/crossly/crossly.app.mjs`):
  - PAT auth (`$auth.api_key`) and dynamic options for listings, inventory, orders and offers
  - page/limit pagination
  - `429` retries that wait out `Retry-After`
  - readable error messages built from the `{ error: { code, message }, correlationId }` envelope
- 18 actions:
  - Account: Get Account
  - Listings: List, Get, Create (Crosspost), Update, Delist
  - Inventory: List, Get, Create, Update, Set Stock
  - Orders: List, Get, Update, Add Tracking
  - Sales and offers: List Sales, List Offers, Respond to Offer
- 21 instant sources, one per Crossly webhook event:
  - `sale.detected`
  - `order.*`
  - `refund.issued`
  - `return.*`
  - `listing.created` / `price_changed` / `delisted`
  - `inventory.quantity_changed`
  - `offer.*`
  - `message.received`
  - `connection.disconnected`
  - `automation.failed`

  They work as REST hooks through `POST`/`DELETE /v1/webhooks`. Each delivery's `Crossly-Signature` HMAC is verified, and events are deduplicated on the envelope id.
- CI (syntax check, eslint, component-shape validation, unit tests) and a tag-driven release with a build-provenance attestation.

[0.1.0]: https://github.com/crossly-dev/crossly-pipedream/releases/tag/v0.1.0
