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

    // Block 3D assets in CI to prevent page crashes during UI interactions
    if (process.env.CI === "true") {
      console.log(
        "🚫 CI Mode: Blocking 3D assets to prevent page instability..."
      );

      await page.route("**/*", async (route) => {
        const url = route.request().url();

        // Block 3D model files and WebGL-heavy assets
        if (
          url.includes(".gltf") ||
          url.includes(".glb") ||
          url.includes(".obj") ||
          url.includes(".fbx") ||
          url.includes("three.js") ||
          url.includes("webgl") ||
          url.includes("babylon") ||
          url.match(/\.(bin|drc)$/)
        ) {
          console.log(`🚫 Blocked 3D asset: ${url.split("/").pop()}`);
          await route.abort();
          return;
        }

        // Allow UI assets (images, CSS, JS for UI components)
        await route.continue();
      });

      // Inject script to disable WebGL context creation
      await page.addInitScript(() => {
        const originalGetContext = HTMLCanvasElement.prototype.getContext;
        (HTMLCanvasElement.prototype.getContext as any) = function (
          this: HTMLCanvasElement,
          contextType: string,
          ...args: any[]
        ) {
          if (contextType === "webgl" || contextType === "webgl2") {
            console.log("🚫 Blocked WebGL context creation in CI");
            return null;
          }
          return originalGetContext.call(this, contextType as any, ...args);
        };
      });
    }

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

      await navigationHelper.navigateToHome();
    });
  });
});
