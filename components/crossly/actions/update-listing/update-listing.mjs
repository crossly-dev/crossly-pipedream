import crossly from "../../crossly.app.mjs";
import {
  compact, parseObject, toNumber,
} from "../../common/utils.mjs";

export default {
  key: "crossly-update-listing",
  name: "Update Listing",
  description: "Edit a listing and push the change to its live marketplace copies. [See the documentation](https://crossly.net/docs/api-listings#update)",
  version: "0.0.1",
  type: "action",
  props: {
    crossly,
    listingId: {
      propDefinition: [
        crossly,
        "listingId",
      ],
    },
    price: {
      type: "string",
      label: "Price",
      description: "New price in dollars.",
      optional: true,
    },
    title: {
      type: "string",
      label: "Title",
      optional: true,
    },
    description: {
      type: "string",
      label: "Description",
      optional: true,
    },
    additionalChanges: {
      type: "object",
      label: "Additional Changes",
      description: "Any other listing fields to change.",
      optional: true,
    },
    platforms: {
      propDefinition: [
        crossly,
        "platforms",
      ],
      description: "Only push to these marketplaces. Leave empty for everywhere the listing is live.",
      optional: true,
    },
  },
  async run({ $ }) {
    const changes = compact({
      price: toNumber(this.price, "Price"),
      title: this.title,
      description: this.description,
      ...parseObject(this.additionalChanges),
    });
    if (!Object.keys(changes).length) throw new Error("Provide at least one field to change.");
    const res = await this.crossly.updateListing({
      $,
      listingId: this.listingId,
      data: compact({
        changes,
        platforms: this.platforms,
      }),
    });
    $.export("$summary", `Updated listing ${this.listingId} (${res.jobs?.length ?? 0} update job(s))`);
    return res;
  },
};
