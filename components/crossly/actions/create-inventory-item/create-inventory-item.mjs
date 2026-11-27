import crossly from "../../crossly.app.mjs";
import {
  inventoryBody, inventoryFieldProps,
} from "../../common/inventory-props.mjs";

export default {
  key: "crossly-create-inventory-item",
  name: "Create Inventory Item",
  description: "Create an inventory item (counts towards the plan's monthly new items). [See the documentation](https://crossly.net/docs/api-inventory#create)",
  version: "0.0.1",
  type: "action",
  props: {
    crossly,
    defaultTitle: {
      type: "string",
      label: "Title",
      description: "1-140 characters. Required.",
    },
    ...inventoryFieldProps,
  },
  async run({ $ }) {
    const item = await this.crossly.createInventoryItem({
      $,
      data: inventoryBody(this),
    });
    $.export("$summary", `Created inventory item ${item.id}`);
    return item;
  },
};
