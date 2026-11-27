import crossly from "../../crossly.app.mjs";
import { compact } from "../../common/utils.mjs";

export default {
  key: "crossly-list-listings",
  name: "List Listings",
  description: "List listings, optionally filtered by platform, status, SKU, tag or change time. [See the documentation](https://crossly.net/docs/api-listings#list)",
  version: "0.0.1",
  type: "action",
  props: {
    crossly,
    platform: {
      propDefinition: [
        crossly,
        "platform",
      ],
    },
    status: {
      type: "string",
      label: "Status",
      description: "Filter on listing status, e.g. `draft`, `active`, `ended`, `sold`.",
      optional: true,
    },
    sku: {
      type: "string",
      label: "SKU",
      description: "Exact SKU match.",
      optional: true,
    },
    tag: {
      type: "string",
      label: "Tag",
      description: "Only listings carrying any of these tags (comma-separated).",
      optional: true,
    },
    stillLive: {
      type: "boolean",
      label: "Still Live",
      description: "Only listings still active on at least one marketplace.",
      optional: true,
    },
    updatedSince: {
      propDefinition: [
        crossly,
        "updatedSince",
      ],
    },
    maxResults: {
      propDefinition: [
        crossly,
        "maxResults",
      ],
    },
  },
  async run({ $ }) {
    const rows = [];
    for await (const row of this.crossly.paginate({
      fn: (opts) => this.crossly.listListings({
        $,
        ...opts,
      }),
      params: compact({
        platform: this.platform,
        status: this.status,
        sku: this.sku,
        tag: this.tag,
        stillLive: this.stillLive,
        updatedSince: this.updatedSince,
      }),
      max: this.maxResults,
    })) rows.push(row);
    $.export("$summary", `Retrieved ${rows.length} listing(s)`);
    return rows;
  },
};
