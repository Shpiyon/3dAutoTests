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
      console.log(`🔍 Starting test for amenity: ${amenity.label}`);
      console.log(`📍 Navigating to amenities page...`);
      await navigationHelper.navigateToAmenities();

      console.log(`🖱️ Clicking pin for ${amenity.label}...`);
      await amenitiesHelper.clickPin(
        amenitiesPage[amenity.pin as keyof AmenitiesPage] as any
      );

      console.log(
        `✅ Expecting amenity card to be visible with title: ${amenity.label}`
      );
      await amenitiesHelper.expectAmenityCardVisibleWithTitle(amenity.label);

      console.log(`📸 Taking screenshot for ${amenity.label}...`);
      console.log(
        `🔧 CI Environment: ${process.env.CI === "true" ? "YES" : "NO"}`
      );

      if (process.env.CI === "true") {
        console.log(`📦 Taking element screenshot of amenitiesCard...`);
        console.log(`🎯 Element selector: #amenitiesCard`);

        // Add extra wait and stability check before screenshot
        console.log(`⏳ Waiting for element to be stable...`);
        await page.waitForTimeout(2000); // Give extra time for animations/transitions

        // Check if element is visible and stable
        const isVisible = await amenitiesPage.amenitieCard.isVisible();
        console.log(`👁️ Element visibility check: ${isVisible}`);

        if (isVisible) {
          const boundingBox = await amenitiesPage.amenitieCard.boundingBox();
          console.log(`📏 Element bounding box:`, boundingBox);
        }

        await runScreenshotTestWithReport(
          screenshotTester,
          `3d-amenity-${amenity.label.toLowerCase()}-view`,
          {
            element: amenitiesPage.amenitieCard,
          }
        );
      } else {
        console.log(`📦 Taking full page screenshot...`);
        await runScreenshotTestWithReport(
          screenshotTester,
          `3d-amenity-${amenity.label.toLowerCase()}-view`
        );
      }

      console.log(`✅ Test completed for amenity: ${amenity.label}`);
    });
  });
});
