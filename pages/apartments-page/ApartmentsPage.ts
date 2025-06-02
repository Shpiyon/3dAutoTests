import { Page, Locator } from "@playwright/test";
import { BasePage } from "../BasePage";
import { NavigationComponent } from "../../components/navigation-component/NavigationComponent";

export class ApartmentsPage extends BasePage {
  readonly navigationComponent: NavigationComponent;

  readonly apartmentCard: Locator;
  readonly apartment1: Locator;
  readonly apartment2: Locator;
  readonly apartment3: Locator;
  readonly villas: Locator;

  constructor(page: Page) {
    super(page);

    this.navigationComponent = new NavigationComponent(page);

    this.apartmentCard = page.locator("#apartmentsCard");
    this.apartment1 = page.locator('[data-apt-id="apt-101"]');
    this.apartment2 = page.locator('[data-apt-id="apt-102"]');
    this.apartment3 = page.locator('[data-apt-id="apt-103"]');
    this.villas = page.locator('[data-apt-id="villas"]');
  }
}
