import { Page, expect, Locator } from "@playwright/test";
import { AmenitiesPage } from "./AmenitiesPage";

export class AmenitiesPageHelper {
  private readonly amenitiesPage: AmenitiesPage;
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
    this.amenitiesPage = new AmenitiesPage(page);
  }

  async clickPin(pin: Locator) {
    console.log(
      `[${new Date().toISOString()}] Waiting for pin to be visible...`
    );
    await expect(pin).toBeVisible({ timeout: 20000 });
    console.log(`[${new Date().toISOString()}] Pin is visible, clicking...`);
    await pin.click({ force: true });
    console.log(`[${new Date().toISOString()}] Pin clicked`);

    if (process.env.CI !== "true") {
      console.log(
        `[${new Date().toISOString()}] Local environment - waiting 5s for 3D transitions`
      );
      await this.page.waitForTimeout(5000); // Allow 3D transitions to complete
    } else {
      console.log(
        `[${new Date().toISOString()}] CI environment - waiting 8s for 3D transitions`
      );
      await this.page.waitForTimeout(8000); // Longer wait in CI
    }
    console.log(`[${new Date().toISOString()}] Pin click sequence completed`);
  }

  async expectAmenityCardVisibleWithTitle(expectedTitle: string) {
    console.log(
      `[${new Date().toISOString()}] Waiting for amenity card to be visible...`
    );
    await expect(this.amenitiesPage.amenitieCard).toBeVisible({
      timeout: 10000,
    });
    console.log(`[${new Date().toISOString()}] Amenity card is visible`);

    const h3 = this.amenitiesPage.amenitieCardTitle;
    console.log(
      `[${new Date().toISOString()}] Waiting for card title to be visible...`
    );
    await expect(h3).toBeVisible();
    console.log(
      `[${new Date().toISOString()}] Card title is visible, checking text...`
    );
    await expect(h3).toHaveText(expectedTitle, { timeout: 5000 });
    console.log(
      `[${new Date().toISOString()}] Card title matches expected: ${expectedTitle}`
    );

    // Additional wait for card to fully stabilize
    console.log(
      `[${new Date().toISOString()}] Waiting additional 3s for card to stabilize...`
    );
    await this.page.waitForTimeout(3000);
    console.log(
      `[${new Date().toISOString()}] Card should be fully stabilized now`
    );
  }
}
