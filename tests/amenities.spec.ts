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

  amenityTests.forEach((amenity) => {
    test(`Amenity: ${amenity.label} - 3D Scene and Card Visual Regression`, async () => {
      await navigationHelper.navigateToAmenities();

      if (process.env.CI === "true") {
        // CI: Add debugging and better waits for UI components
        console.log(`CI Mode: Testing amenity ${amenity.label}`);

        try {
          // Wait for the specific pin to be visible and clickable
          const pin = amenitiesPage[amenity.pin as keyof AmenitiesPage] as any;
          console.log(`Waiting for pin: ${amenity.pin}`);
          await pin.waitFor({ state: "visible", timeout: 20000 });

          // Click pin and wait for card update
          await amenitiesHelper.clickPin(pin);
          await amenitiesHelper.expectAmenityCardVisibleWithTitle(
            amenity.label
          );

          // Wait for amenity card to be present before interactions
          await amenitiesPage.amenitieCard.waitFor({
            state: "visible",
            timeout: 15000,
          });
          console.log(`Found amenity card for ${amenity.label}`);

          // Take element screenshot
          await runScreenshotTestWithReport(
            screenshotTester,
            `3d-amenity-${amenity.label.toLowerCase()}-view`,
            {
              element: amenitiesPage.amenitieCard,
            }
          );

          console.log(`Successfully completed ${amenity.label} test`);
        } catch (error) {
          console.error(`CI Error for ${amenity.label}:`, error);
          console.error(
            `Error details: ${
              error instanceof Error ? error.message : String(error)
            }`
          );
          throw error;
        }
      } else {
        await amenitiesHelper.clickPin(
          amenitiesPage[amenity.pin as keyof AmenitiesPage] as any
        );
        await amenitiesHelper.expectAmenityCardVisibleWithTitle(amenity.label);
        await runScreenshotTestWithReport(
          screenshotTester,
          `3d-amenity-${amenity.label.toLowerCase()}-view`
        );
      }

      await navigationHelper.navigateToHome();
    });
  });
});
