import crossly from "../../crossly.app.mjs";
import { toNumber } from "../../common/utils.mjs";

export default {
  key: "crossly-respond-to-offer",
  name: "Respond to Offer",
  description: "Accept, decline or counter a buyer offer on a Crossly marketplace listing. [See the documentation](https://crossly.net/docs/ref-offers)",
  version: "0.0.1",
  type: "action",
  props: {
    crossly,
    offerId: {
      propDefinition: [
        crossly,
        "offerId",
      ],
    },
    action: {
      type: "string",
      label: "Action",
      options: [
        "accept",
        "decline",
        "counter",
      ],
    },
    counterPrice: {
      type: "string",
      label: "Counter Price",
      description: "Counter amount in dollars (required for `counter`; sent as cents).",
      optional: true,
    },
  },
  async run({ $ }) {
    const data = {
      action: this.action,
    };
    if (this.action === "counter") {
      const dollars = toNumber(this.counterPrice, "Counter Price");
      if (dollars === undefined) throw new Error("Counter Price is required to counter.");
      data.counterCents = Math.round(dollars * 100);
    }
    const res = await this.crossly.respondToOffer({
      $,
      offerId: this.offerId,
      data,
    });
    $.export("$summary", `Offer ${this.offerId}: ${res.status}`);
    return res;
  },
};
