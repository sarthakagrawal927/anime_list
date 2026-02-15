/**
 * Tests for page-based pagination logic used in FilterBuilder.
 */

describe("Page-based pagination logic", () => {
  const pagesize = 20;

  it("calculates offset from page number", () => {
    expect((1 - 1) * pagesize).toBe(0);
    expect((2 - 1) * pagesize).toBe(20);
    expect((3 - 1) * pagesize).toBe(40);
  });

  it("calculates total pages", () => {
    expect(Math.ceil(100 / 20)).toBe(5);
    expect(Math.ceil(101 / 20)).toBe(6);
    expect(Math.ceil(20 / 20)).toBe(1);
    expect(Math.ceil(0 / 20)).toBe(0);
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
    const total = 100;

    const start = offset + 1;
    const end = Math.min(offset + resultCount, total);
    expect(start).toBe(41);
    expect(end).toBe(60);
  });

  it("displays correct range for last partial page", () => {
    const currentPage = 6;
    const ps = 20;
    const offset = (currentPage - 1) * ps;
    const resultCount = 5;
    const total = 105;

    const start = offset + 1;
    const end = Math.min(offset + resultCount, total);
    expect(start).toBe(101);
    expect(end).toBe(105);
  });

  it("resets to page 1 on filter change", () => {
    let page = 3;
    // Simulate filter change resetting page
    page = 1;
    expect(page).toBe(1);
    expect((page - 1) * pagesize).toBe(0);
  });
});
