import { test, Page, BrowserContext } from "@playwright/test";
import { AmenitiesPage } from "../pages/amenities-page/AmenitiesPage";
import { AmenitiesPageHelper } from "../pages/amenities-page/AmenitiesPageHelper";
import { ScreenshotTester } from "../utils/screenshotTester";
import { BaselineScreenshotManager } from "../utils/baselineScreenshotManager";
import { runScreenshotTestWithReport } from "../utils/testReportUtils";
import { NavigationComponentHelper } from "components/navigation-component/navigationComponentHelper";

test.describe("Amenities Page Visual Regression Tests", () => {
  let navigationHelper: NavigationComponentHelper;
  let amenitiesPage: AmenitiesPage;
  let amenitiesHelper: AmenitiesPageHelper;
  let screenshotTester: ScreenshotTester;
  let page: Page;
  let context: BrowserContext;

  test.beforeAll(async ({ browser }) => {
    await BaselineScreenshotManager.initializeBaselines();
    context = await browser.newContext();
    page = await context.newPage();
    amenitiesPage = new AmenitiesPage(page);
    amenitiesHelper = new AmenitiesPageHelper(page);
    screenshotTester = new ScreenshotTester(page, browser);
    navigationHelper = new NavigationComponentHelper(page);
    await amenitiesPage.startPage();
  });

  test.afterAll(async () => {
    await page.close();
    await context.close();
  });

  const amenityTests = [
    { pin: "gymPin", label: "Gym" },
    { pin: "poolPin", label: "Pool" },
    { pin: "loungePin", label: "Lounge Area by the Pool" },
    { pin: "childrenPlygroundPin", label: "Children Playground" },
    { pin: "parkingPin", label: "Parking" },
  ];

  for (const { pin, label } of amenityTests) {
    test(`Amenity: ${label} - 3D Scene and Card Visual Regression`, async () => {
      await navigationHelper.navigateToAmenities();
      await amenitiesHelper.clickPin(
        amenitiesPage[pin as keyof AmenitiesPage] as any
      );
      await amenitiesHelper.expectAmenityCardVisibleWithTitle(label);

      await runScreenshotTestWithReport(
        screenshotTester,
        `3d-amenity-${label.toLowerCase()}-view`
      );
    });
  }
});
