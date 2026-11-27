import {
  compact, parseObject, toNumber,
} from "./utils.mjs";

// Inventory fields from https://crossly.net/docs/api-inventory#resource-shape
export const CONDITIONS = [
  "new_with_tags",
  "new_without_tags",
  "like_new",
  "good_used",
  "fair",
];

export const inventoryFieldProps = {
  defaultDescription: {
    type: "string",
    label: "Description",
    optional: true,
  },
  defaultPrice: {
    type: "string",
    label: "Price",
    description: "Default price in dollars, e.g. `84.00`.",
    optional: true,
  },
  originalPrice: {
    type: "string",
    label: "Original Price (MSRP)",
    optional: true,
  },
  brand: {
    type: "string",
    label: "Brand",
    optional: true,
  },
  size: {
    type: "string",
    label: "Size",
    optional: true,
  },
  condition: {
    type: "string",
    label: "Condition",
    options: CONDITIONS,
    optional: true,
  },
  sku: {
    type: "string",
    label: "SKU",
    optional: true,
  },
  quantity: {
    type: "integer",
    label: "Quantity",
    optional: true,
  },
  images: {
    type: "string[]",
    label: "Image URLs",
    description: "HTTPS URLs; index 0 is the primary photo.",
    optional: true,
  },
  tags: {
    type: "string[]",
    label: "Tags",
    optional: true,
  },
  notes: {
    type: "string",
    label: "Private Notes",
    optional: true,
  },
  additionalFields: {
    type: "object",
    label: "Additional Fields",
    description: "Any other inventory fields, e.g. `color`, `category`, `labels`, `customLabel`, `warehouseLocation`.",
    optional: true,
  },
};

export function inventoryBody(self) {
  return compact({
    defaultTitle: self.defaultTitle,
    defaultDescription: self.defaultDescription,
    defaultPrice: toNumber(self.defaultPrice, "Price"),
    originalPrice: toNumber(self.originalPrice, "Original Price"),
    brand: self.brand,
    size: self.size,
    condition: self.condition,
    sku: self.sku,
    quantity: self.quantity,
    images: self.images,
    tags: self.tags,
    notes: self.notes,
    ...parseObject(self.additionalFields),
  });
}
