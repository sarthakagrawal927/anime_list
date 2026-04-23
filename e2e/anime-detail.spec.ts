import { expect, test } from "@playwright/test";

const malId = process.env.E2E_ANIME_MAL_ID || "16498";
const animeTitle = process.env.E2E_ANIME_TITLE || "Attack on Titan";

test("anime detail page loads from the deployed API", async ({ page }) => {
  const detailApiPath = `/api/anime/${malId}`;
  const saasmakerRequests: string[] = [];

  page.on("request", (request) => {
    if (request.url().includes("api.sassmaker.com")) {
      saasmakerRequests.push(request.url());
    }
  });

  const detailResponsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === "GET" && response.url().includes(detailApiPath),
  );

  await page.goto(`/anime/${malId}`);

  const detailResponse = await detailResponsePromise;
  expect(detailResponse.status()).toBe(200);

  await expect(page.getByRole("heading", { name: new RegExp(animeTitle, "i") })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Synopsis" })).toBeVisible();
  await expect(page.getByText("Recommendations", { exact: true })).toBeVisible();
  await expect(page.getByText("Unable to load anime details")).toHaveCount(0);
  await expect(page.getByText("API error: 404")).toHaveCount(0);
  expect(saasmakerRequests).toEqual([]);
});
