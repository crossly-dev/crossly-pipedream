import crossly from "../../crossly.app.mjs";

export default {
  key: "crossly-get-account",
  name: "Get Account",
  description: "Identity check: the authenticated seller, the token scopes and plan. [See the documentation](https://crossly.net/docs/api-authentication)",
  version: "0.0.1",
  type: "action",
  props: {
    crossly,
  },
  async run({ $ }) {
    const me = await this.crossly.getMe({
      $,
    });
    $.export("$summary", `Authenticated as ${me.email || me.userId}`);
    return me;
  },
};
