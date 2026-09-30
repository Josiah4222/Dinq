import { Component, OnInit, computed } from '@angular/core';
import { RevealDirective } from '../reveal.directive';
import { CmsPage } from '../core/cms-page';
import { ImageSrcPipe } from '../core/image-src.pipe';

/**
 * /about/kairos-law-alliance ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â the alliance page on its own: hero, the two
 * paragraphs describing how Dinq and Kairos Law work together, and what that
 * means for clients.
 *
 * Copy is read from the `kairos-law-alliance` page in the CMS and layered over
 * the values below. The values in this file are the shipped copy and the
 * fallback for every key, so the page renders identically whether the API
 * answers, answers with nothing, or is unreachable.
 */
@Component({
  selector: 'app-kairos-law-alliance',
  imports: [RevealDirective, ImageSrcPipe],
  templateUrl: './kairos-law-alliance.component.html',
  styleUrl: './kairos-law-alliance.component.scss',
})
export class KairosLawAllianceComponent extends CmsPage implements OnInit {
  /* ---- Hero ----------------------------------------------------------------- */
  readonly heroImage = computed(() =>
    this.content.text(this.values(), 'hero.image', '/media/assets/images/hero-addis.jpg'),
  );
  readonly heroEyebrow = computed(() => this.content.text(this.values(), 'hero.eyebrow', 'About Dinq Advisory Group'));
  readonly heroTitle = computed(() =>
    this.content.text(this.values(), 'hero.title', 'Strategic Alliance with Kairos Law'),
  );

  /* ---- Alliance ------------------------------------------------------------- */
  readonly allianceLogo = computed(() =>
    this.content.text(this.values(), 'alliance.logo', '/media/KAIROS_Logo_White_transparent.png'),
  );
  readonly allianceLabel = computed(() => this.content.text(this.values(), 'alliance.label', 'Strategic Legal Partner'));
  readonly allianceEyebrow = computed(() => this.content.text(this.values(), 'alliance.eyebrow', 'Strategic Alliance'));
  readonly allianceHeading = computed(() =>
    this.content.text(this.values(), 'alliance.heading', 'An Integrated Client Experience'),
  );
  readonly allianceParagraphs = computed<string[]>(() =>
    this.content.list<string>(this.values(), 'alliance.paragraphs', ALLIANCE_FALLBACK),
  );
  readonly allianceBenefitsHeading = computed(() =>
    this.content.text(this.values(), 'alliance.benefitsHeading', 'What This Means for Clients'),
  );
  readonly allianceBenefits = computed<string[]>(() =>
    this.content.list<string>(this.values(), 'alliance.benefits', BENEFIT_FALLBACK),
  );

  ngOnInit(): void {
    this.bind('kairos-law-alliance');
  }
}

/* The shipped copy, and the fallback for every key above. Keeping it here means
   the page is complete without the CMS, and the seed in backend/cms matches. */
const ALLIANCE_FALLBACK: string[] = [
  'Cross-border business and investment mandates frequently involve both commercial decisions and regulated legal work. Through Dinq\'s strategic collaboration with Kairos Law, clients can receive coordinated advisory, implementation, and legal support without having to manage disconnected workstreams themselves.',
  'Dinq remains the advisory and execution lead. Kairos Law provides Ethiopian legal services where required and within its professional mandate. The two teams coordinate around the client\'s objectives, while maintaining the appropriate professional roles and responsibilities.',
];

const BENEFIT_FALLBACK: string[] = [
  'A coordinated strategy across commercial and legal workstreams.',
  'Fewer disconnected handoffs between advisors.',
  'Clearer implementation sequencing and stakeholder coordination.',
  'Access to legal support when a mandate requires it.',
  'A single client-centred approach focused on practical execution.',
];
