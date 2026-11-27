import crossly from "../../crossly.app.mjs";
import {
  inventoryBody, inventoryFieldProps,
} from "../../common/inventory-props.mjs";

export default {
  key: "crossly-update-inventory-item",
  name: "Update Inventory Item",
  description: "Partially update an inventory item. This does not push to live listings: use **Update Listing** for that, or **Set Stock** for quantities. [See the documentation](https://crossly.net/docs/api-inventory#update)",
  version: "0.0.1",
  type: "action",
  props: {
    crossly,
    inventoryItemId: {
      propDefinition: [
        crossly,
        "inventoryItemId",
      ],
    },
    defaultTitle: {
      type: "string",
      label: "Title",
      optional: true,
    },
    ...inventoryFieldProps,
  },
  async run({ $ }) {
    const data = inventoryBody(this);
    if (!Object.keys(data).length) throw new Error("Provide at least one field to change.");
    const item = await this.crossly.updateInventoryItem({
      $,
      inventoryItemId: this.inventoryItemId,
      data,
    });
    $.export("$summary", `Updated inventory item ${this.inventoryItemId}`);
    return item;
  },
};
