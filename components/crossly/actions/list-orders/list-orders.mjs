import crossly from "../../crossly.app.mjs";
import { compact } from "../../common/utils.mjs";

export default {
  key: "crossly-list-orders",
  name: "List Orders",
  description: "List orders with sale price, fees, SKU and line items. [See the documentation](https://crossly.net/docs/api-orders#list-orders)",
  version: "0.0.1",
  type: "action",
  props: {
    crossly,
    status: {
      type: "string",
      label: "Status",
      description: "Exact match, e.g. `needs_fulfillment`, `shipped`, `delivered`, `refunded`, `disputed`.",
      optional: true,
    },
    platform: {
      propDefinition: [
        crossly,
        "platform",
      ],
    },
    channel: {
      type: "string",
      label: "Channel",
      description: "Only orders sold through this business channel.",
      options: [
        "retail",
        "wholesale",
        "auction",
        "live",
        "world",
        "pos",
        "rental",
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
      fn: (opts) => this.crossly.listOrders({
        $,
        ...opts,
      }),
      params: compact({
        status: this.status,
        platform: this.platform,
        channel: this.channel,
        updatedSince: this.updatedSince,
      }),
      max: this.maxResults,
    })) rows.push(row);
    $.export("$summary", `Retrieved ${rows.length} order(s)`);
    return rows;
  },
};
