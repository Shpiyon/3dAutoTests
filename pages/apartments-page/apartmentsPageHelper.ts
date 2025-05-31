import { Page, expect } from "@playwright/test";
import { ApartmentsPage } from "./ApartmentsPage";

export class ApartmentsPageHelper {
  private readonly apartmentsPage: ApartmentsPage;

  constructor(page: Page) {
    this.apartmentsPage = new ApartmentsPage(page);
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
}
