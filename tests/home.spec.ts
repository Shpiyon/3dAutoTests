import { test } from "../utils/testFixtures";
import { HomePage } from "../pages/HomePage";
import { ScreenshotTester } from "../utils/screenshotTester";
import { runScreenshotTestWithReport } from "../utils/testReportUtils";

test.describe("Home Page Functionality", () => {
  let screenshotTester: ScreenshotTester;
  let homePage: HomePage | null;

  test.beforeEach(async ({ page, createPage }) => {
    screenshotTester = new ScreenshotTester(page);
    homePage = await createPage(HomePage);
    test.skip(!homePage, "Not supported for this project type");
  });

  test("Should have working navigation menu", async () => {
    await homePage!.navigationComponentHelper.verifyNavigationIsVisible();
    await runScreenshotTestWithReport(
      screenshotTester,
      "3d-homepage-navBar-element",
      {
        element: homePage!.navigationComponent.topNavbar,
      }
    );
  });

  test.describe("Full-page Visual Regression Tests", () => {
    test.skip(
      process.env.CI === "true",
      "Skipping full-page screenshot tests in CI"
    );

    test("3D Homepage Visual Regression Test (Default view)", async () => {
      await runScreenshotTestWithReport(
        screenshotTester,
        "3d-homepage-base-view"
      );
    });

    test("3D Homepage Visual Regression Test (Home view)", async ({ page }) => {
      await homePage!.navigationComponentHelper.navigateToHome();
      await page.waitForTimeout(5000);
      await runScreenshotTestWithReport(
        screenshotTester,
        "3d-homepage-home-view"
      );
    });
  });
});
