import { Page, Locator } from "@playwright/test";

export class NavigationComponent {
  readonly topNavbar: Locator;
  readonly navList: Locator;
  readonly navItems: Locator;
  readonly homeNavLink: Locator;
  readonly apartmentsNavLink: Locator;
  readonly amenitiesNavLink: Locator;

  constructor(page: Page) {
    this.topNavbar = page.locator(".navbar");
    this.navList = page.locator(".navlist");
    this.navItems = page.locator(".navlist__item");
    this.homeNavLink = page.locator('.navlist__item:has-text("Home")');
    this.apartmentsNavLink = page.locator(
      '.navlist__item:has-text("Apartments")'
    );
    this.amenitiesNavLink = page.locator(
      '.navlist__item:has-text("Amenities")'
    );
  }
}
