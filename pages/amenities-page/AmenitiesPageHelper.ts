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
    await expect(pin).toBeVisible();
    await pin.click();
    await this.page.waitForTimeout(5000); // Allow 3D transitions to complete
  }

  async expectAmenityCardVisibleWithTitle(expectedTitle: string) {
    await expect(this.amenitiesPage.amenitieCard).toBeVisible({
      timeout: 10000,
    });
    const h3 = this.amenitiesPage.amenitieCardTitle;
    await expect(h3).toBeVisible();
    await expect(h3).toHaveText(expectedTitle, { timeout: 5000 });
  }
}
