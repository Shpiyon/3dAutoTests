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

    this.gymPin = page.locator(".pin-wrapper").filter({
      has: page.locator("span").filter({ hasText: /^Gym$/ }).first(),
    });

    this.poolPin = page
      .locator(".pin-wrapper")
      .filter({
        has: page.locator("span").filter({ hasText: /^Pool$/ }),
      })
      .first();

    this.loungePin = page
      .locator(".pin-wrapper")
      .filter({
        has: page
          .locator("span")
          .filter({ hasText: /^Lounge Area by the Pool$/ }),
      })
      .first();

    this.childrenPlygroundPin = page
      .locator(".pin-wrapper")
      .filter({
        has: page.locator("span").filter({ hasText: /^Children Playground$/ }),
      })
      .first();

    this.parkingPin = page
      .locator(".pin-wrapper")
      .filter({
        has: page.locator("span").filter({ hasText: /^Parking$/ }),
      })
      .first();

    this.amenitieCard = page.locator("#amenitiesCard");

    this.amenitieCardTitle = this.amenitieCard.locator("h3");
  }
}
