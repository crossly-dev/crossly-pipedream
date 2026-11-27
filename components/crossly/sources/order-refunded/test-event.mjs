export default {
  id: "9c3e1a2b-4d5f-6789-abcd-ef0123456789",
  type: "order.refunded",
  created: "2026-05-22T19:08:42.110Z",
  data: {
    orderId: "0a1b2c3d-4e5f-6789-abcd-ef0123456789",
    refundId: "5e6f7a8b-9c0d-4e1f-a2b3-c4d5e6f7a8b9",
    platform: "ebay",
    platformRefundId: "5012345678",
    amount: 12.5,
    totalRefunded: 12.5,
    full: false,
    reason: "Arrived with a scuffed corner.",
    lineItems: [
      {
        orderId: "0a1b2c3d-4e5f-6789-abcd-ef0123456789",
        quantity: 1,
      },
    ],
    source: "api",
  },
};
