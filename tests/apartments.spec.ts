import { test } from "../utils/testFixtures";
import { expect } from "@playwright/test";
import { ApartmentsPage } from "../pages/apartments-page/ApartmentsPage";
import { ApartmentsPageHelper } from "../pages/apartments-page/apartmentsPageHelper";
import { NavigationComponentHelper } from "../components/navigation-component/navigationComponentHelper";
import { ScreenshotTester } from "../utils/screenshotTester";
import { runScreenshotTestWithReport } from "../utils/testReportUtils";

test.describe("Apartments Page Visual Regression Tests", () => {
  let apartmentsHelper: ApartmentsPageHelper;
  let navigationHelper: NavigationComponentHelper;
  let screenshotTester: ScreenshotTester;
  let apartmentsPage: ApartmentsPage | null;

  test.beforeEach(async ({ page, createPage }, testInfo) => {
    apartmentsHelper = new ApartmentsPageHelper(page, testInfo.project.name);
    navigationHelper = new NavigationComponentHelper(page);
    screenshotTester = new ScreenshotTester(page);
    apartmentsPage = await createPage(ApartmentsPage);
    test.skip(!apartmentsPage, "Not supported for this project type");
  });

  test("Apartments page UI elements on their place", async () => {
    await navigationHelper.navigateToApartments();
    await apartmentsHelper.verifyApartmentCardWithOptionsDisplayed();
    expect(await navigationHelper.isNavItemActive("Apartments")).toBeTruthy();

    // Semantic methods - no direct locator access!
    await apartmentsHelper.verifyApartment1Text("Apartments, block 1");
    await apartmentsHelper.verifyApartment2Text("Apartments, block 2");
    await apartmentsHelper.verifyApartment3Text("Apartments, block 3");
    await apartmentsHelper.verifyVillasText("Villa");

    await runScreenshotTestWithReport(
      screenshotTester,
      "apartments-list-view",
      {
        element: apartmentsHelper.getApartmentCard(),
      }
    );

    await runScreenshotTestWithReport(
      screenshotTester,
      "apartments-top-panel",
      {
        element: apartmentsHelper.getTopNavbar(),
      }
    );
  });

  test.describe("3D Apartment Type Visual Regression Tests", () => {
    test.skip(
      process.env.CI === "true",
      "Skipping detailed apartment type tests in CI"
    );

    test("3D Apartments Main View Visual Regression Test", async () => {
      await navigationHelper.navigateToApartments();
      await runScreenshotTestWithReport(
        screenshotTester,
        "3d-apartments-main-view"
      );
    });

    test("3D Apartment Type 1 Visual Regression Test", async ({ page }) => {
      await navigationHelper.navigateToApartments();
      await apartmentsHelper.clickApartment1Option();
      await page.waitForTimeout(5000);
      await runScreenshotTestWithReport(
        screenshotTester,
        "3d-apartment-type-1-view"
      );
    });

    test("3D Apartment Type 2 Visual Regression Test", async ({ page }) => {
      await navigationHelper.navigateToApartments();
      await apartmentsHelper.clickApartment2Option();
      await page.waitForTimeout(5000);
      await runScreenshotTestWithReport(
        screenshotTester,
        "3d-apartment-type-2-view"
      );
    });

    test("3D Apartment Type 3 Visual Regression Test", async ({ page }) => {
      await navigationHelper.navigateToApartments();
      await apartmentsHelper.clickApartment3Option();
      await page.waitForTimeout(5000);
      await runScreenshotTestWithReport(
        screenshotTester,
        "3d-apartment-type-3-view"
      );
    });

    test("3D Villas View Visual Regression Test", async ({ page }) => {
      await navigationHelper.navigateToApartments();
      await apartmentsHelper.clickVillas();
      await page.waitForTimeout(5000);
      await runScreenshotTestWithReport(screenshotTester, "3d-villas-view");
    });
  });
});
