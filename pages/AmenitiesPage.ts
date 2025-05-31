import { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";
import { NavigationComponent } from "../components/navigation-component/NavigationComponent";

export class AmenitiesPage extends BasePage {
  readonly navigation: NavigationComponent;

  readonly gymPin: Locator;
  readonly poolPin: Locator;
  readonly spaPin: Locator;
  readonly restaurantPin: Locator;
  readonly clubhousePin: Locator;
  readonly parkingPin: Locator;

  constructor(page: Page) {
    super(page);

    this.navigation = new NavigationComponent(page);

    this.gymPin = page.locator(".pin-wrapper", {
      has: page.locator("span", { hasText: "Gym" }),
    });

    this.poolPin = page.locator(".pin-wrapper", {
      has: page.locator("span", { hasText: "Pool" }),
    });

    this.spaPin = page.locator(".pin-wrapper", {
      has: page.locator("span", { hasText: "Spa" }),
    });

    this.restaurantPin = page.locator(".pin-wrapper", {
      has: page.locator("span", { hasText: "Restaurant" }),
    });

    this.clubhousePin = page.locator(".pin-wrapper", {
      has: page.locator("span", { hasText: "Clubhouse" }),
    });

    this.parkingPin = page.locator(".pin-wrapper", {
      has: page.locator("span", { hasText: "Parking" }),
    });
  }
}
