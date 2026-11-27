import crossly from "../../crossly.app.mjs";
import {
  compact, parseObject, toNumber,
} from "../../common/utils.mjs";

export default {
  key: "crossly-create-listing",
  name: "Create Listing (Crosspost)",
  description: "Create a listing and fan out crosspost jobs to the chosen marketplaces. [See the documentation](https://crossly.net/docs/api-listings#create-crosspost)",
  version: "0.0.1",
  type: "action",
  props: {
    crossly,
    platforms: {
      propDefinition: [
        crossly,
        "platforms",
      ],
      description: "Marketplaces to crosspost to (1-15).",
    },
    inventoryItemId: {
      propDefinition: [
        crossly,
        "inventoryItemId",
      ],
      description: "Recommended: the inventory item this listing represents (inherits its defaults and lets the sale cascade find it).",
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
    price: {
      type: "string",
      label: "Price",
      description: "Listing price in dollars, e.g. `84.00`.",
      optional: true,
    },
    images: {
      type: "string[]",
      label: "Image URLs",
      description: "HTTPS image URLs; the first is the primary photo.",
      optional: true,
    },
    additionalData: {
      type: "object",
      label: "Additional Listing Fields",
      description: "Any other `data` fields, e.g. `condition`, `brand`, `size`, `sku`, `weightLb`, `weightOz`, `platformOverrides`. Merged over the fields above.",
      optional: true,
    },
    createInventoryItem: {
      type: "boolean",
      label: "Create Inventory Item",
      description: "With no inventory item, also create one from these fields.",
      optional: true,
    },
    clientReferenceId: {
      type: "string",
      label: "Client Reference ID",
      description: "Your own id (up to 100 chars). A repeat with the same reference returns the existing listing instead of a duplicate.",
      optional: true,
    },
  },
  async run({ $ }) {
    const data = compact({
      title: this.title,
      description: this.description,
      price: toNumber(this.price, "Price"),
      images: this.images,
      ...parseObject(this.additionalData),
    });
    const res = await this.crossly.createListing({
      $,
      data: compact({
        platforms: this.platforms,
        inventoryItemId: this.inventoryItemId,
        data,
        createInventoryItem: this.createInventoryItem,
        clientReferenceId: this.clientReferenceId,
      }),
    });
    $.export("$summary", `Created listing ${res.listing?.id} with ${res.jobs?.length ?? 0} crosspost job(s)${res.skipped?.length
      ? `, ${res.skipped.length} skipped`
      : ""}`);
    return res;
  },
};
