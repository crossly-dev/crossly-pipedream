import crossly from "../../crossly.app.mjs";

export default {
  key: "crossly-get-order",
  name: "Get Order",
  description: "Get one order with its sale price, fees, SKU and line items. [See the documentation](https://crossly.net/docs/api-orders#get-one)",
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
  },
  async run({ $ }) {
    const order = await this.crossly.getOrder({
      $,
      orderId: this.orderId,
    });
    $.export("$summary", `Retrieved order ${order.platformOrderId || order.id} (${order.status})`);
    return order;
  },
};
