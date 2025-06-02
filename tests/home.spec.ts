import { test, Page, BrowserContext } from "@playwright/test";
import { HomePage } from "../pages/HomePage";
import { ScreenshotTester } from "../utils/screenshotTester";
import { BaselineScreenshotManager } from "../utils/baselineScreenshotManager";
import { runScreenshotTestWithReport } from "../utils/testReportUtils";

test.describe("Home Page Functionality", () => {
  let homePage: HomePage;
  let screenshotTester: ScreenshotTester;
  let page: Page;
  let context: BrowserContext;

  test.beforeAll(async ({ browser }) => {
    await BaselineScreenshotManager.initializeBaselines();
    context = await browser.newContext();
    page = await context.newPage();
    homePage = new HomePage(page);
    await homePage.startPage();
    screenshotTester = new ScreenshotTester(page, browser);
  });

  test.afterAll(async () => {
    await page.close();
    await context.close();
  });

  test("Should have working navigation menu", async () => {
    await homePage.navigationComponent.verifyNavigationIsVisible();
  });

  test("3D Homepage Visual Regression Test (Default view)", async () => {
    await runScreenshotTestWithReport(
      screenshotTester,
      "3d-homepage-base-view"
    );
  });

  test("3D Homepage Visual Regression Test (Home view)", async () => {
    await homePage.navigationComponent.navigateToHome();
    await runScreenshotTestWithReport(
      screenshotTester,
      "3d-homepage-home-view"
    );
  });
});
