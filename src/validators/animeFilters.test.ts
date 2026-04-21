import { filterRequestSchema } from "./animeFilters";

describe("filterRequestSchema", () => {
  it("defaults pagesize to 40", () => {
    const parsed = filterRequestSchema.parse({
      filters: [],
    });

    expect(parsed.pagesize).toBe(40);
    expect(parsed.offset).toBe(0);
  });

  it("accepts single-value type filters", () => {
    const parsed = filterRequestSchema.parse({
      filters: [
        {
          field: "type",
          action: "EQUALS",
          value: "TV",
        },
      ],
    });

    expect(parsed.filters).toEqual([
      expect.objectContaining({
        field: "type",
        action: "EQUALS",
        value: "TV",
      }),
    ]);
  });
});
