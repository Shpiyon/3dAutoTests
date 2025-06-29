import { test } from "@playwright/test";
import { HomePage } from "../pages/HomePage";
import { ScreenshotTester } from "../utils/screenshotTester";
import { runScreenshotTestWithReport } from "../utils/testReportUtils";

test.describe("Element Screenshot Examples", () => {
  let homePage: HomePage;
  let screenshotTester: ScreenshotTester;

  test.beforeEach(async ({ page, browser }) => {
    homePage = new HomePage(page);
    await homePage.startPage();
    screenshotTester = new ScreenshotTester(page, browser);
  });

  test("Navigation bar screenshot", async () => {
    await runScreenshotTestWithReport(screenshotTester, "navigation-bar", {
      element: homePage.navigationComponent.navigationComponent.topNavbar,
    });
  });

  test("Full page screenshot", async () => {
    await runScreenshotTestWithReport(screenshotTester, "full-page");
  });
});
