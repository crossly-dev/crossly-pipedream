import crossly from "../../crossly.app.mjs";
import { compact } from "../../common/utils.mjs";

export default {
  key: "crossly-update-order",
  name: "Update Order",
  description: "Update an order's status or notes. To add tracking and notify the marketplace use **Add Tracking**. [See the documentation](https://crossly.net/docs/api-orders#more-order-endpoints)",
  version: "0.0.1",
  type: "action",
  props: {
    crossly,
    orderId: {
      propDefinition: [
        crossly,
        "orderId",
      ],
    },
    status: {
      type: "string",
      label: "Status",
      description: "New status, e.g. `shipped` or `delivered`.",
      options: [
        "needs_fulfillment",
        "label_purchased",
        "shipped",
        "in_transit",
        "delivered",
      ],
      optional: true,
    },
    notes: {
      type: "string",
      label: "Notes",
      optional: true,
    },
  },
  async run({ $ }) {
    const data = compact({
      status: this.status,
      notes: this.notes,
    });
    if (!Object.keys(data).length) throw new Error("Provide a status or notes.");
    const order = await this.crossly.updateOrder({
      $,
      orderId: this.orderId,
      data,
    });
    $.export("$summary", `Updated order ${this.orderId} (${order.status})`);
    return order;
  },
};
