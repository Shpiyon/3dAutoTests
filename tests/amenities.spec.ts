import { test, Page, BrowserContext } from "@playwright/test";
import { AmenitiesPage } from "../pages/amenities-page/AmenitiesPage";
import { AmenitiesPageHelper } from "../pages/amenities-page/AmenitiesPageHelper";
import { ScreenshotTester } from "../utils/screenshotTester";
import { runScreenshotTestWithReport } from "../utils/testReportUtils";
import { NavigationComponentHelper } from "components/navigation-component/navigationComponentHelper";

test.describe("Amenities Page Visual Regression Tests", () => {
  let navigationHelper: NavigationComponentHelper;
  let amenitiesPage: AmenitiesPage;
  let amenitiesHelper: AmenitiesPageHelper;
  let screenshotTester: ScreenshotTester;
  let page: Page;
  let context: BrowserContext;

  if (process.env.CI === "true") {
    test.beforeEach(async ({ browser }) => {
      context = await browser.newContext();
      page = await context.newPage();
      amenitiesPage = new AmenitiesPage(page);
      amenitiesHelper = new AmenitiesPageHelper(page);
      screenshotTester = new ScreenshotTester(page);
      navigationHelper = new NavigationComponentHelper(page);
      await amenitiesPage.startPage();
    });

    test.afterEach(async () => {
      await page.close();
      await context.close();
    });
  } else {
    test.beforeAll(async ({ browser }) => {
      context = await browser.newContext();
      page = await context.newPage();
      amenitiesPage = new AmenitiesPage(page);
      amenitiesHelper = new AmenitiesPageHelper(page);
      screenshotTester = new ScreenshotTester(page);
      navigationHelper = new NavigationComponentHelper(page);
      await amenitiesPage.startPage();
    });

    test.afterAll(async () => {
      await page.close();
      await context.close();
    });
  }

  const amenityTests = [
    { pin: "gymPin", label: "Gym" },
    { pin: "poolPin", label: "Pool" },
    { pin: "loungePin", label: "Lounge Area by the Pool" },
    { pin: "childrenPlygroundPin", label: "Children Playground" },
    { pin: "parkingPin", label: "Parking" },
  ];

  amenityTests.forEach((amenity) => {
    test(`Amenity: ${amenity.label} - 3D Scene and Card Visual Regression`, async () => {
      await navigationHelper.navigateToAmenities();
      await amenitiesHelper.clickPin(
        amenitiesPage[amenity.pin as keyof AmenitiesPage] as any
      );
      await amenitiesHelper.expectAmenityCardVisibleWithTitle(amenity.label);

      if (process.env.CI === "true") {
        await runScreenshotTestWithReport(
          screenshotTester,
          `3d-amenity-${amenity.label.toLowerCase()}-view`,
          {
            element: amenitiesPage.amenitieCard,
          }
        );
      } else {
        await runScreenshotTestWithReport(
          screenshotTester,
          `3d-amenity-${amenity.label.toLowerCase()}-view`
        );
      }
    });
  });
});
