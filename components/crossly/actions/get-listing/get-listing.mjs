import crossly from "../../crossly.app.mjs";

export default {
  key: "crossly-get-listing",
  name: "Get Listing",
  description: "Get one listing with its platform rows. [See the documentation](https://crossly.net/docs/api-listings#get-one)",
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
  },
  async run({ $ }) {
    const listing = await this.crossly.getListing({
      $,
      listingId: this.listingId,
    });
    $.export("$summary", `Retrieved listing ${listing.title || listing.id}`);
    return listing;
  },
};
