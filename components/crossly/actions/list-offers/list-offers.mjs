import crossly from "../../crossly.app.mjs";

export default {
  key: "crossly-list-offers",
  name: "List Offers",
  description: "List buyer offers on your Crossly marketplace listings, including bundles. Offers made on other marketplaces arrive through the **New Offer Received** source. [See the documentation](https://crossly.net/docs/ref-offers)",
  version: "0.0.1",
  type: "action",
  props: {
    crossly,
    status: {
      type: "string",
      label: "Status",
      options: [
        "pending",
        "accepted",
        "declined",
        "countered",
        "expired",
        "withdrawn",
      ],
      optional: true,
    },
    limit: {
      type: "integer",
      label: "Limit",
      optional: true,
      min: 1,
    },
  },
  async run({ $ }) {
    const params = {};
    if (this.status) params.status = this.status;
    if (this.limit) params.limit = this.limit;
    const { offers = [] } = await this.crossly.listOffers({
      $,
      params,
    });
    $.export("$summary", `Retrieved ${offers.length} offer(s)`);
    return offers;
  },
};
