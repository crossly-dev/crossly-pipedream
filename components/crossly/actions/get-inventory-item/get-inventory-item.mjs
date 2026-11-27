import crossly from "../../crossly.app.mjs";

export default {
  key: "crossly-get-inventory-item",
  name: "Get Inventory Item",
  description: "Get one inventory item with its platform listings. [See the documentation](https://crossly.net/docs/api-inventory#get-one-item)",
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
  },
  async run({ $ }) {
    const item = await this.crossly.getInventoryItem({
      $,
      inventoryItemId: this.inventoryItemId,
    });
    $.export("$summary", `Retrieved inventory item ${item.defaultTitle || this.inventoryItemId}`);
    return item;
  },
};
