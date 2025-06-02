import { Page, Locator } from "@playwright/test";
import { BasePage } from "../BasePage";
import { NavigationComponent } from "../../components/navigation-component/NavigationComponent";

export class AmenitiesPage extends BasePage {
  readonly navigation: NavigationComponent;

  readonly gymPin: Locator;
  readonly poolPin: Locator;
  readonly loungePin: Locator;
  readonly childrenPlygroundPin: Locator;
  readonly parkingPin: Locator;
  readonly amenitieCard: Locator;
  readonly amenitieCardTitle: Locator;

  constructor(page: Page) {
    super(page);

    this.navigation = new NavigationComponent(page);

    this.gymPin = page.locator(".pin-wrapper", {
      has: page.locator("span", { hasText: "Gym" }),
    });

    this.poolPin = page.locator(".pin-wrapper", {
      has: page.locator("span", { hasText: "Pool" }),
    });

    this.loungePin = page.locator(".pin-wrapper", {
      has: page.locator("span", { hasText: "Lounge Area by the Pool" }),
    });

    this.childrenPlygroundPin = page.locator(".pin-wrapper", {
      has: page.locator("span", { hasText: "Children Playground" }),
    });

    this.parkingPin = page.locator(".pin-wrapper", {
      has: page.locator("span", { hasText: "Parking" }),
    });

    this.amenitieCard = page.locator("#amenitiesCard");

    this.amenitieCardTitle = this.amenitieCard.locator("h3");
  }
}
