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

  // const amenityTests = [
  //   { pin: "gymPin", label: "Gym" },
  //   { pin: "poolPin", label: "Pool" },
  //   { pin: "loungePin", label: "Lounge Area by the Pool" },
  //   { pin: "childrenPlygroundPin", label: "Children Playground" },
  //   { pin: "parkingPin", label: "Parking" },
  // ];

  // amenityTests.forEach((amenity) => {
  //   test(`Amenity: ${amenity.label} - 3D Scene and Card Visual Regression`, async () => {
  //     await navigationHelper.navigateToAmenities();
  //     await amenitiesHelper.clickPin(
  //       amenitiesPage[amenity.pin as keyof AmenitiesPage] as any
  //     );
  //     await amenitiesHelper.expectAmenityCardVisibleWithTitle(amenity.label);

  //     if (process.env.CI === "true") {
  //       await runScreenshotTestWithReport(
  //         screenshotTester,
  //         `3d-amenity-${amenity.label.toLowerCase()}-view`,
  //         {
  //           element: amenitiesPage.amenitieCard,
  //         }
  //       );
  //     } else {
  //       await runScreenshotTestWithReport(
  //         screenshotTester,
  //         `3d-amenity-${amenity.label.toLowerCase()}-view`
  //       );
  //     }

  //     await navigationHelper.navigateToHome();
  //   });
  // });

  // Individual tests for each amenity
  test("Amenity: Gym - 3D Scene and Card Visual Regression", async () => {
    await navigationHelper.navigateToAmenities();
    await amenitiesHelper.clickPin(amenitiesPage.gymPin);
    await amenitiesHelper.expectAmenityCardVisibleWithTitle("Gym");

    if (process.env.CI === "true") {
      await runScreenshotTestWithReport(
        screenshotTester,
        "3d-amenity-gym-view",
        {
          element: amenitiesPage.amenitieCard,
        }
      );
    } else {
      await runScreenshotTestWithReport(
        screenshotTester,
        "3d-amenity-gym-view"
      );
    }

    await navigationHelper.navigateToHome();
  });

  test("Amenity: Pool - 3D Scene and Card Visual Regression", async () => {
    await navigationHelper.navigateToAmenities();
    await amenitiesHelper.clickPin(amenitiesPage.poolPin);
    await amenitiesHelper.expectAmenityCardVisibleWithTitle("Pool");

    if (process.env.CI === "true") {
      await runScreenshotTestWithReport(
        screenshotTester,
        "3d-amenity-pool-view",
        {
          element: amenitiesPage.amenitieCard,
        }
      );
    } else {
      await runScreenshotTestWithReport(
        screenshotTester,
        "3d-amenity-pool-view"
      );
    }

    await navigationHelper.navigateToHome();
  });

  test("Amenity: Lounge Area by the Pool - 3D Scene and Card Visual Regression", async () => {
    await navigationHelper.navigateToAmenities();
    await amenitiesHelper.clickPin(amenitiesPage.loungePin);
    await amenitiesHelper.expectAmenityCardVisibleWithTitle(
      "Lounge Area by the Pool"
    );

    if (process.env.CI === "true") {
      await runScreenshotTestWithReport(
        screenshotTester,
        "3d-amenity-lounge-area-by-the-pool-view",
        {
          element: amenitiesPage.amenitieCard,
        }
      );
    } else {
      await runScreenshotTestWithReport(
        screenshotTester,
        "3d-amenity-lounge-area-by-the-pool-view"
      );
    }

    await navigationHelper.navigateToHome();
  });

  test("Amenity: Children Playground - 3D Scene and Card Visual Regression", async () => {
    await navigationHelper.navigateToAmenities();
    await amenitiesHelper.clickPin(amenitiesPage.childrenPlygroundPin);
    await amenitiesHelper.expectAmenityCardVisibleWithTitle(
      "Children Playground"
    );

    if (process.env.CI === "true") {
      await runScreenshotTestWithReport(
        screenshotTester,
        "3d-amenity-children-playground-view",
        {
          element: amenitiesPage.amenitieCard,
        }
      );
    } else {
      await runScreenshotTestWithReport(
        screenshotTester,
        "3d-amenity-children-playground-view"
      );
    }

    await navigationHelper.navigateToHome();
  });

  test("Amenity: Parking - 3D Scene and Card Visual Regression", async () => {
    await navigationHelper.navigateToAmenities();
    await amenitiesHelper.clickPin(amenitiesPage.parkingPin);
    await amenitiesHelper.expectAmenityCardVisibleWithTitle("Parking");

    if (process.env.CI === "true") {
      await runScreenshotTestWithReport(
        screenshotTester,
        "3d-amenity-parking-view",
        {
          element: amenitiesPage.amenitieCard,
        }
      );
    } else {
      await runScreenshotTestWithReport(
        screenshotTester,
        "3d-amenity-parking-view"
      );
    }

    await navigationHelper.navigateToHome();
  });
});
