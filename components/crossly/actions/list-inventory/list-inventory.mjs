import crossly from "../../crossly.app.mjs";
import { compact } from "../../common/utils.mjs";

export default {
  key: "crossly-list-inventory",
  name: "List Inventory",
  description: "List inventory items, optionally filtered by status, SKU, marketplaces or change time. [See the documentation](https://crossly.net/docs/api-inventory#list-inventory)",
  version: "0.0.1",
  type: "action",
  props: {
    crossly,
    status: {
      type: "string",
      label: "Status",
      options: [
        "active",
        "sold",
        "archived",
      ],
      optional: true,
    },
    sku: {
      type: "string",
      label: "SKU",
      description: "Exact SKU match.",
      optional: true,
    },
    platforms: {
      propDefinition: [
        crossly,
        "platforms",
      ],
      description: "Only items live on any of these marketplaces (or on none of them, with Platform Mode `not_listed`).",
      optional: true,
    },
    platformMode: {
      type: "string",
      label: "Platform Mode",
      options: [
        "listed",
        "not_listed",
      ],
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
      fn: (opts) => this.crossly.listInventory({
        $,
        ...opts,
      }),
      params: compact({
        status: this.status,
        sku: this.sku,
        platforms: this.platforms?.join(","),
        platformMode: this.platformMode,
        updatedSince: this.updatedSince,
      }),
      max: this.maxResults,
    })) rows.push(row);
    $.export("$summary", `Retrieved ${rows.length} inventory item(s)`);
    return rows;
  },
};
