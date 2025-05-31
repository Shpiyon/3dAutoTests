import { Page, expect } from "@playwright/test";
import { NavigationComponent } from "./NavigationComponent";

export class NavigationComponentHelper {
  private page: Page;

  navigationComponent: NavigationComponent;

  constructor(page: Page) {
    this.page = page;
    this.navigationComponent = new NavigationComponent(page);
  }

  /**
   * Navigate to Home section
   */
  async navigateToHome(): Promise<void> {
    await this.navigationComponent.homeNavLink.click();
  }

  /**
   * Navigate to Apartments section
   */
  async navigateToApartments(): Promise<void> {
    await this.navigationComponent.apartmentsNavLink.click();
  }

  /**
   * Navigate to Amenities section
   */
  async navigateToAmenities(): Promise<void> {
    await this.navigationComponent.amenitiesNavLink.click();
  }
  /**
   * Get the currently active navigation item
   */
  async getActiveNavItem(): Promise<string | null> {
    return await this.page.locator(".navlist__item.active").textContent();
  }

  /**
   * Check if specific navigation item is active
   */
  async isNavItemActive(itemText: string): Promise<boolean> {
    const activeItem = await this.getActiveNavItem();
    return activeItem?.toLowerCase().includes(itemText.toLowerCase()) || false;
  }

  // ======================
  // WAIT FUNCTIONS
  // ======================

  /**
   * Wait for navigation to load
   */
  async waitForNavigationLoad(): Promise<void> {
    await this.navigationComponent.navList.waitFor({ state: "visible" });
  }

  /**
   * Verify that all navigation elements are visible and the nav item count is 3
   */
  async verifyNavigationIsVisible() {
    await expect(this.navigationComponent.topNavbar).toBeVisible();
    await expect(this.navigationComponent.navList).toBeVisible();
    await expect(this.navigationComponent.homeNavLink).toBeVisible();
    await expect(this.navigationComponent.apartmentsNavLink).toBeVisible();
    await expect(this.navigationComponent.amenitiesNavLink).toBeVisible();
    expect(await this.navigationComponent.navItems.count()).toBe(3);
  }
}
