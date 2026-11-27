import crossly from "../../crossly.app.mjs";
import { compact } from "../../common/utils.mjs";

export default {
  key: "crossly-add-tracking",
  name: "Add Tracking",
  description: "Submit a tracking number and carrier for an order and push it to the marketplace (marks the order shipped). [See the documentation](https://crossly.net/docs/api-orders#submit-tracking)",
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
    trackingNumber: {
      type: "string",
      label: "Tracking Number",
    },
    carrier: {
      type: "string",
      label: "Carrier",
      description: "e.g. `usps`, `ups`, `fedex`.",
      optional: true,
    },
    trackingUrl: {
      type: "string",
      label: "Tracking URL",
      optional: true,
    },
  },
  async run({ $ }) {
    const res = await this.crossly.addTracking({
      $,
      orderId: this.orderId,
      data: compact({
        trackingNumber: this.trackingNumber,
        carrier: this.carrier,
        trackingUrl: this.trackingUrl,
      }),
    });
    $.export("$summary", `Submitted tracking ${this.trackingNumber} for order ${this.orderId}`);
    return res;
  },
};
