import { Component } from '@angular/core';
import { SiteNavComponent } from './site-nav/site-nav.component';
import { HeroComponent } from './hero/hero.component';
import { WhyDinqComponent } from './why-dinq/why-dinq.component';
import { HowWeWorkComponent } from './how-we-work/how-we-work.component';
import { SolutionsComponent } from './solutions/solutions.component';
import { IndustriesComponent } from './industries/industries.component';
import { KairosAllianceComponent } from './kairos-alliance/kairos-alliance.component';
import { ClosingStatementComponent } from './closing-statement/closing-statement.component';
import { ContactSectionComponent } from './contact-section/contact-section.component';
import { FooterComponent } from './footer/footer.component';

/**
 * Root component — the single-page experience. Each section is its own
 * component stacked here in reading order; the ids on the host elements are the
 * anchor targets used by the nav and CTA scroll links.
 */
@Component({
  selector: 'app-root',
  imports: [
    SiteNavComponent,
    HeroComponent,
    WhyDinqComponent,
    HowWeWorkComponent,
    SolutionsComponent,
    IndustriesComponent,
    KairosAllianceComponent,
    ClosingStatementComponent,
    ContactSectionComponent,
    FooterComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {}
