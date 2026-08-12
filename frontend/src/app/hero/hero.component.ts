import { Component } from '@angular/core';
import { ScrollToDirective } from '../scroll-to.directive';
import { BrandLogoComponent } from '../brand-logo/brand-logo.component';

/**
 * Hero — full-bleed editorial photography with a navy overlay.
 * On load, logo -> headline -> subhead -> proof -> CTAs animate in
 * sequentially (stagger ~120ms apart) using pure CSS keyframes.
 */
@Component({
  selector: 'app-hero',
  imports: [ScrollToDirective, BrandLogoComponent],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss',
})
export class HeroComponent {}
