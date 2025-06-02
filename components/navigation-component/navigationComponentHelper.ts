import { Page, expect } from "@playwright/test";
import { NavigationComponent } from "./NavigationComponent";

export class NavigationComponentHelper {
  private page: Page;
  navigationComponent: NavigationComponent;

  constructor(page: Page) {
    this.page = page;
    this.navigationComponent = new NavigationComponent(page);
  }

  async navigateToHome(): Promise<void> {
    await this.navigationComponent.homeNavLink.click();
  }

  async navigateToApartments(): Promise<void> {
    await this.navigationComponent.apartmentsNavLink.click();
  }

  async navigateToAmenities(): Promise<void> {
    await this.navigationComponent.amenitiesNavLink.click();
  }

  async getActiveNavItem(): Promise<string | null> {
    return await this.page.locator(".navlist__item.active").textContent();
  }

  async isNavItemActive(itemText: string): Promise<boolean> {
    const activeItem = await this.getActiveNavItem();
    return activeItem?.toLowerCase().includes(itemText.toLowerCase()) || false;
  }

  async waitForNavigationLoad(): Promise<void> {
    await this.navigationComponent.navList.waitFor({ state: "visible" });
  }

  async verifyNavigationIsVisible() {
    await expect(this.navigationComponent.topNavbar).toBeVisible();
    await expect(this.navigationComponent.navList).toBeVisible();
    await expect(this.navigationComponent.homeNavLink).toBeVisible();
    await expect(this.navigationComponent.apartmentsNavLink).toBeVisible();
    await expect(this.navigationComponent.amenitiesNavLink).toBeVisible();
    expect(await this.navigationComponent.navItems.count()).toBe(3);
  }
}
