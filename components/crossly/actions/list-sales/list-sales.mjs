import crossly from "../../crossly.app.mjs";

export default {
  key: "crossly-list-sales",
  name: "List Sales",
  description: "List sales (each unique sale event), newest first by detection time. [See the documentation](https://crossly.net/docs/api-sales#list-sales)",
  version: "0.0.1",
  type: "action",
  props: {
    crossly,
    maxResults: {
      propDefinition: [
        crossly,
        "maxResults",
      ],
    },
  },
  async run({ $ }) {
    const rows = [];
    for await (const row of this.crossly.paginate({
      fn: (opts) => this.crossly.listSales({
        $,
        ...opts,
      }),
      max: this.maxResults,
    })) rows.push(row);
    $.export("$summary", `Retrieved ${rows.length} sale(s)`);
    return rows;
  },
};
