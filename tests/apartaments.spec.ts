import { test, Page, BrowserContext, expect } from "@playwright/test";
import { ApartmentsPage } from "../pages/apartments-page/ApartmentsPage";
import { ApartmentsPageHelper } from "../pages/apartments-page/apartmentsPageHelper";
import { NavigationComponentHelper } from "../components/navigation-component/navigationComponentHelper";
import { ScreenshotTester } from "../utils/screenshotTester";
import { BaselineScreenshotManager } from "../utils/baselineScreenshotManager";
import { runScreenshotTestWithReport } from "../utils/testReportUtils";

test.describe("Apartments Page Visual Regression Tests", () => {
  let apartmentsPage: ApartmentsPage;
  let apartmentsHelper: ApartmentsPageHelper;
  let navigationHelper: NavigationComponentHelper;
  let screenshotTester: ScreenshotTester;
  let page: Page;
  let context: BrowserContext;

  test.beforeAll(async ({ browser }) => {
    await BaselineScreenshotManager.initializeBaselines();
    context = await browser.newContext();
    page = await context.newPage();
    apartmentsPage = new ApartmentsPage(page);
    apartmentsHelper = new ApartmentsPageHelper(page);
    navigationHelper = new NavigationComponentHelper(page);
    screenshotTester = new ScreenshotTester(page, browser);
    await apartmentsPage.startPage();
  });

  test.afterAll(async () => {
    await page.close();
    await context.close();
  });

  test("Apartments page UI elements on their place", async () => {
    await navigationHelper.navigateToApartments();
    await apartmentsHelper.verifyApartmentCardWithOptionsDisplayed();
    expect(await navigationHelper.isNavItemActive("Apartments")).toBeTruthy();

    await apartmentsHelper.verifyApartmentOptionText(
      apartmentsPage.apartment1,
      "Apartments, block 1"
    );

    await apartmentsHelper.verifyApartmentOptionText(
      apartmentsPage.apartment2,
      "Apartments, block 2"
    );

    await apartmentsHelper.verifyApartmentOptionText(
      apartmentsPage.apartment3,
      "Apartments, block 3"
    );

    await apartmentsHelper.verifyApartmentOptionText(
      apartmentsPage.villas,
      "Villa"
    );
  });

  test("3D Apartments Main View Visual Regression Test", async () => {
    await navigationHelper.navigateToApartments();
    await runScreenshotTestWithReport(
      screenshotTester,
      "3d-apartments-main-view"
    );
  });

  test("3D Apartment Type 1 Visual Regression Test", async () => {
    await navigationHelper.navigateToApartments();
    await apartmentsHelper.clickApartment1Option();
    await page.waitForTimeout(5000);
    await runScreenshotTestWithReport(
      screenshotTester,
      "3d-apartment-type-1-view"
    );
  });

  test("3D Apartment Type 2 Visual Regression Test", async () => {
    await navigationHelper.navigateToApartments();
    await apartmentsHelper.clickApartment2Option();
    await page.waitForTimeout(5000);
    await runScreenshotTestWithReport(
      screenshotTester,
      "3d-apartment-type-2-view"
    );
  });

  test("3D Apartment Type 3 Visual Regression Test", async () => {
    await navigationHelper.navigateToApartments();
    await apartmentsHelper.clickApartment3Option();
    await page.waitForTimeout(5000);
    await runScreenshotTestWithReport(
      screenshotTester,
      "3d-apartment-type-3-view"
    );
  });

  test("3D Villas View Visual Regression Test", async () => {
    await navigationHelper.navigateToApartments();
    await apartmentsHelper.clickVillas();
    await page.waitForTimeout(5000);
    await runScreenshotTestWithReport(screenshotTester, "3d-villas-view");
  });
});
