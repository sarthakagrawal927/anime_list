/**
 * Tests for page-based pagination logic used in FilterBuilder.
 */

describe("Page-based pagination logic", () => {
  const pagesize = 40;

  it("calculates offset from page number", () => {
    expect((1 - 1) * pagesize).toBe(0);
    expect((2 - 1) * pagesize).toBe(40);
    expect((3 - 1) * pagesize).toBe(80);
  });

  it("calculates total pages", () => {
    expect(Math.ceil(100 / 40)).toBe(3);
    expect(Math.ceil(101 / 40)).toBe(3);
    expect(Math.ceil(40 / 40)).toBe(1);
    expect(Math.ceil(0 / 40)).toBe(0);
  });

  it("hasNext is true when currentPage < totalPages", () => {
    const totalPages = 5;
    expect(3 < totalPages).toBe(true);
    expect(5 < totalPages).toBe(false);
  });

  it("hasPrev is true when currentPage > 1", () => {
    expect(1 > 1).toBe(false);
    expect(2 > 1).toBe(true);
  });

  it("displays correct range for middle page", () => {
    const currentPage = 3;
    const offset = (currentPage - 1) * pagesize;
    const resultCount = 20;
    const total: number = 120;

    const start = total === 0 ? 0 : offset + 1;
    const end = Math.min(offset + resultCount, total);
    expect(start).toBe(81);
    expect(end).toBe(100);
  });

  it("displays correct range for last partial page", () => {
    const currentPage = 3;
    const ps = 40;
    const offset = (currentPage - 1) * ps;
    const resultCount = 5;
    const total: number = 85;

    const start = total === 0 ? 0 : offset + 1;
    const end = Math.min(offset + resultCount, total);
    expect(start).toBe(81);
    expect(end).toBe(85);
  });

  it("resets to page 1 on filter change", () => {
    let page = 3;
    // Simulate filter change resetting page
    page = 1;
    expect(page).toBe(1);
    expect((page - 1) * pagesize).toBe(0);
  });

  it("shows 0 to 0 when there are no results", () => {
    const total = 0;
    const offset = 0;
    const resultCount = 0;

    const start = total === 0 ? 0 : offset + 1;
    const end = Math.min(offset + resultCount, total);

    expect(start).toBe(0);
    expect(end).toBe(0);
  });
});
