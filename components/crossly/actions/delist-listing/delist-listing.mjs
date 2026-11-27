import crossly from "../../crossly.app.mjs";

export default {
  key: "crossly-delist-listing",
  name: "Delist Listing",
  description: "Delist a listing everywhere, or only on some marketplaces. [See the documentation](https://crossly.net/docs/api-listings#delist)",
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
    platforms: {
      propDefinition: [
        crossly,
        "platforms",
      ],
      description: "Only delist on these marketplaces. Leave empty for all.",
      optional: true,
    },
  },
  async run({ $ }) {
    const res = await this.crossly.delistListing({
      $,
      listingId: this.listingId,
      params: this.platforms?.length
        ? {
          platforms: this.platforms.join(","),
        }
        : undefined,
    });
    $.export("$summary", `Queued ${res.jobs?.length ?? 0} delist job(s) for listing ${this.listingId}`);
    return res;
  },
};
