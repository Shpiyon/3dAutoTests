import { expect, Locator } from "@playwright/test";
import { ApartmentsPage } from "./ApartmentsPage";

export class ApartmentsPageHelper {
  private readonly apartmentsPage: ApartmentsPage;

  constructor(pageOrDriver: any, projectName?: string) {
    this.apartmentsPage = new ApartmentsPage(pageOrDriver, projectName);
  }

  async verifyApartmentCardWithOptionsDisplayed() {
    await expect(this.apartmentsPage.apartmentCard).toBeVisible();
    await expect(this.apartmentsPage.apartment1).toBeVisible();
    await expect(this.apartmentsPage.apartment2).toBeVisible();
    await expect(this.apartmentsPage.apartment3).toBeVisible();
    await expect(this.apartmentsPage.villas).toBeVisible();
  }

  async clickApartment1Option() {
    await this.apartmentsPage.apartment1.click();
  }

  async clickApartment2Option() {
    await this.apartmentsPage.apartment2.click();
  }

  async clickApartment3Option() {
    await this.apartmentsPage.apartment3.click();
  }

  async clickVillas() {
    await this.apartmentsPage.villas.click();
  }

  // Semantic helper methods - no direct locator passing needed!
  async verifyApartment1Text(expectedText: string) {
    await expect(this.apartmentsPage.apartment1).toHaveText(expectedText);
  }

  async verifyApartment2Text(expectedText: string) {
    await expect(this.apartmentsPage.apartment2).toHaveText(expectedText);
  }

  async verifyApartment3Text(expectedText: string) {
    await expect(this.apartmentsPage.apartment3).toHaveText(expectedText);
  }

  async verifyVillasText(expectedText: string) {
    await expect(this.apartmentsPage.villas).toHaveText(expectedText);
  }

  // Keep the generic method for flexibility
  async verifyApartmentOptionText(locator: Locator, expectedText: string) {
    await expect(locator).toHaveText(expectedText);
  }

  // Helper to get screenshot elements
  getApartmentCard() {
    return this.apartmentsPage.apartmentCard;
  }

  getTopNavbar() {
    return this.apartmentsPage.navigationComponent.topNavbar;
  }
}
