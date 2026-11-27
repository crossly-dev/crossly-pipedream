import crossly from "../../crossly.app.mjs";

export default {
  key: "crossly-set-stock",
  name: "Set Stock",
  description: "Set, increase or decrease the available stock of one or more inventory items in one write; live marketplace listings follow (anything reaching 0 is delisted). [See the documentation](https://crossly.net/docs/api-inventory#more-inventory-endpoints)",
  version: "0.0.1",
  type: "action",
  props: {
    crossly,
    inventoryItemIds: {
      propDefinition: [
        crossly,
        "inventoryItemId",
      ],
      type: "string[]",
      label: "Inventory Item IDs",
      description: "The items to change.",
    },
    mode: {
      type: "string",
      label: "Mode",
      options: [
        "set",
        "increase",
        "decrease",
      ],
      default: "set",
    },
    value: {
      type: "integer",
      label: "Value",
      description: "The AVAILABLE stock to set, or the amount to add / subtract. Reserved units of open orders are kept.",
      min: 0,
    },
    syncMarketplaces: {
      type: "boolean",
      label: "Sync Marketplaces",
      description: "Push the new stock to live listings (default on the API side).",
      optional: true,
    },
  },
  async run({ $ }) {
    const res = await this.crossly.setStock({
      $,
      data: {
        ids: this.inventoryItemIds,
        mode: this.mode,
        value: this.value,
        ...(this.syncMarketplaces === undefined
          ? {}
          : {
            syncMarketplaces: this.syncMarketplaces,
          }),
      },
    });
    $.export("$summary", `Stock ${this.mode} ${this.value}: ${res.affected} affected, ${res.skipped} skipped`);
    return res;
  },
};
