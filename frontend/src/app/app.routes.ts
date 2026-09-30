import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { ContactComponent } from './contact/contact.component';
import { QuickInquiryComponent } from './quick-inquiry/quick-inquiry.component';
import { AboutComponent } from './about/about.component';
import { WhoWeAreComponent } from './about/who-we-are.component';
import { LeadershipComponent } from './about/leadership.component';
import { OurApproachComponent } from './about/our-approach.component';
import { KairosLawAllianceComponent } from './about/kairos-law-alliance.component';
import { StandardPageComponent } from './standard-page/standard-page.component';
import { SolutionsIndexComponent } from './solutions/solutions-index.component';
import { SolutionDetailComponent } from './solutions/solution-detail.component';
import { IndustryDetailComponent } from './industries/industry-detail.component';
import { InsightsIndexComponent } from './insights/insights-index.component';
import { InsightArticleComponent } from './insights/insight-article.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { LoginComponent } from './login/login.component';
import { StaffDashboardComponent } from './admin/staff-dashboard.component';
import { StaffSubmissionDetailComponent } from './admin/staff-submission-detail.component';
import { PagesListComponent } from './admin/pages-list.component';
import { PageEditorComponent } from './admin/page-editor.component';
import { guestGuard, staffGuard } from './core/auth.guard';

/**
 * App routes. The homepage is the full landing page; contact owns the unified
 * booking/contact form. Reusable templates serve the remaining pages:
 * Standard Content Page (about, why-ethiopia, representative-matters, and the
 * placeholder legal pages), index + detail templates for solutions, industries,
 * and insights (Sections 6, 7, 10), and the 404 catch-all (Section 12.3).
 */
export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'contact', component: ContactComponent },
  {
    path: 'quick-inquiry',
    component: QuickInquiryComponent,
  },
  // Staff sign-in, served by the site rather than the Django admin so the
  // backend session is established through the same origin as the frontend.
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  // Staff-only landing page. The guard re-checks the session with the backend
  // on a cold load, then bounces anyone unsigned to /login.
  // /admin is a redirect rather than a screen: the submission queues are
  // separate destinations in the rail, and one of them has to be the landing
  // view. Contact is the default because a consultation is the reason a client
  // is most likely to have written.
  { path: 'admin', redirectTo: 'admin/contact', pathMatch: 'full' },
  {
    path: 'admin/contact',
    component: StaffDashboardComponent,
    canActivate: [staffGuard],
    data: { tab: 'contacts' },
  },
  {
    // One consultation request in full, opened from its row in the list.
    path: 'admin/contact/:id',
    component: StaffSubmissionDetailComponent,
    canActivate: [staffGuard],
    data: { source: 'contact' },
  },
  {
    // The short-form messages, listed apart from the consultation requests.
    // Same screen, same records, different `source` on the request.
    path: 'admin/quick-inquiries',
    component: StaffDashboardComponent,
    canActivate: [staffGuard],
    data: { tab: 'quickInquiries' },
  },
  {
    path: 'admin/quick-inquiries/:id',
    component: StaffSubmissionDetailComponent,
    canActivate: [staffGuard],
    data: { source: 'quick_inquiry' },
  },
  {
    path: 'admin/property-leads',
    component: StaffDashboardComponent,
    canActivate: [staffGuard],
    data: { tab: 'leads' },
  },
  {
    path: 'admin/newsletter',
    component: StaffDashboardComponent,
    canActivate: [staffGuard],
    data: { tab: 'subscribers' },
  },
  {
    // Page content: the card grid of every page, and the editor for one page.
    path: 'admin/pages',
    component: PagesListComponent,
    canActivate: [staffGuard],
  },
  {
    path: 'admin/pages/:slug',
    component: PageEditorComponent,
    canActivate: [staffGuard],
  },
  { path: 'about', component: AboutComponent },
  { path: 'about/who-we-are', component: WhoWeAreComponent },
  { path: 'about/our-approach', component: OurApproachComponent },
  { path: 'about/kairos-law-alliance', component: KairosLawAllianceComponent },
  { path: 'about/leadership', component: LeadershipComponent },
  {
    path: 'solutions',
    component: SolutionsIndexComponent,
  },
  {
    path: 'solutions/:slug',
    component: SolutionDetailComponent,
  },
  // The /industries index page was removed; its per-sector detail pages below
  // stay. The bare path redirects home so old links and bookmarks still land
  // somewhere useful instead of the 404.
  {
    path: 'industries',
    redirectTo: '',
    pathMatch: 'full',
  },
  {
    path: 'industries/:slug',
    component: IndustryDetailComponent,
  },
  {
    path: 'why-ethiopia',
    component: StandardPageComponent,
    data: {
      layout: 'anchors',
      hero: {
        eyebrow: 'Why Ethiopia',
        title: 'Why Ethiopia',
        image: '/media/assets/images/hero-addis.jpg',
      },
      sections: [
        {
          id: 'why-invest',
          heading: 'Why Invest in Ethiopia?',
          kind: 'prose',
          tone: 'tint',
          align: 'left',
          pending: false,
          paragraphs: [
            'Ethiopia is one of Africa\'s largest economies by population, offering a large domestic market, a young and growing workforce, and a strategic position in the Horn of Africa. For international investors and members of the diaspora, the country presents opportunities across agriculture, manufacturing, infrastructure, energy, technology, and services.',
            'Recent reform efforts have opened priority sectors to foreign participation, streamlined business processes, and signalled a stronger commitment to private-sector-led growth. As the policy environment continues to mature, early movers have a chance to establish positions in markets that are still developing.',
            'Dinq supports investors at each stage of this journey — from initial market assessment and strategy to entry, implementation, and long-term stewardship. Because the fundamentals continue to evolve, working with a local partner who understands both the opportunity and the operating reality on the ground matters.',
          ],
        },
        {
          id: 'incentives',
          heading: 'Investment Incentives',
          kind: 'prose',
          tone: 'light',
          align: 'right',
          pending: false,
          paragraphs: [
            'Ethiopia offers a range of investment incentives designed to attract capital to priority sectors and regions. These typically include customs duty exemptions on imported capital goods and construction materials, corporate income tax holidays, and loss carry-forward provisions for qualifying investments.',
            'Incentives are generally administered through the Ethiopian Investment Commission (EIC), with eligibility tied to factors such as sector, investment size, export orientation, and location within industrial parks or regional development zones. Navigating eligibility rules correctly is often the difference between securing and losing a benefit.',
            'This section will map the main incentive categories, eligibility criteria, and the application process, and explain how Dinq helps clients structure their investments to capture available benefits while remaining compliant.',
          ],
        },
        {
          id: 'doing-business',
          heading: 'Doing Business in Ethiopia',
          kind: 'prose',
          tone: 'tint',
          align: 'left',
          pending: false,
          paragraphs: [
            'Establishing a presence in Ethiopia involves registering a business, obtaining the required investment permits, securing a tax identification number, and meeting sector-specific licensing requirements. New investors often need to weigh the choice between branches, local companies, and joint ventures.',
            'Practical considerations — such as land access, utilities, logistics, workforce availability, and foreign-exchange access — shape how quickly an operation can become operational. Realistic planning around these factors reduces costly delays.',
            'Dinq helps clients sequence these steps, coordinate with the relevant authorities, and structure operations so the business can scale as it grows.',
            'Ethiopia\'s regulatory environment is evolving, with oversight distributed across several authorities — including the Ethiopian Investment Commission, sector ministries, the National Bank of Ethiopia, and the Ethiopian Customs Commission. Understanding which agency governs a given matter, and how requirements interact, is essential to maintaining compliance. Dinq monitors regulatory developments and helps clients interpret how changes affect their operations, licenses, and obligations.',
          ],
        },
        {
          id: 'land-property',
          heading: 'Land & Property Ownership',
          kind: 'prose',
          tone: 'tint',
          align: 'left',
          pending: false,
          paragraphs: [
            'In Ethiopia, land is owned by the state and the federal government, and is leased to investors on long-term bases for investment purposes. Leases differ by region, use type, and duration, and are granted through a formal allocation process.',
            'For diaspora and foreign investors, understanding lease structures, due-diligence requirements, and the mechanics of securing and developing land is critical. Property transactions also require careful verification of title, use rights, and existing encumbrances.',
            'Dinq provides guidance on land acquisition, lease negotiation, property due diligence, and — through Property & Asset Management — the long-term stewardship of assets once acquired.',
          ],
        },
        {
          id: 'tax-corporate',
          heading: 'Tax & Corporate Considerations',
          kind: 'prose',
          tone: 'light',
          align: 'right',
          pending: false,
          paragraphs: [
            'Corporate tax, VAT, and withholding taxes apply to most business activity in Ethiopia, with rates and exemptions varying by sector, location, and investor status. Income tax obligations apply to employees and to shareholders through dividend withholding.',
            'Structuring decisions — such as the choice of entity, capital structure, and financing arrangements — have a direct impact on tax exposure and on the ease of repatriating profits and dividends. Transfer pricing rules apply to related-party transactions.',
            'Dinq coordinates corporate structuring and tax-conscious planning with its legal alliance partner Kairos Law, ensuring that structure, compliance, and reporting are aligned from the start.',
          ],
        },
        {
          id: 'market-entry',
          heading: 'Market Entry',
          kind: 'prose',
          tone: 'tint',
          align: 'left',
          pending: false,
          paragraphs: [
            'Market entry guides provide step-by-step orientation for investors entering specific sectors: from pre-entry research and market sizing to licensing, site selection, and launch planning. Each guide is tailored to the practical decisions an investor faces.',
            'Guides cover entry structures, regulatory approvals, incentive eligibility, operational setup, and common pitfalls. They are designed to be practical — not theoretical — reflecting what it actually takes to operate successfully.',
            'These guides will be published progressively, starting with the sectors where Dinq has the deepest working experience. This page will link to each guide as it is released.',
          ],
        },
        {
          id: 'diaspora-guide',
          heading: 'Diaspora Investment Guide',
          kind: 'prose',
          tone: 'light',
          align: 'right',
          pending: false,
          paragraphs: [
            'Ethiopians abroad play a distinctive role in the country\'s economy through remittances, investment, and knowledge transfer. The diaspora investment guide addresses the specific questions Ethiopian nationals overseas ask when investing back home.',
            'Topics include structuring investments as a non-resident, land and property acquisition, business registration, tax treatment of diaspora investors, repatriation of returns, and practical guidance on managing assets from abroad.',
            'Dinq works extensively with diaspora clients and, through its alliance with Kairos Law, provides the coordinated legal and advisory support needed to protect family interests and build long-term value.',
          ],
        },
        {
          id: 'east-africa',
          heading: 'Regional Opportunities in East Africa',
          kind: 'prose',
          tone: 'tint',
          align: 'left',
          pending: false,
          paragraphs: [
            'Ethiopia\'s position in the Horn of Africa connects it to a regional economy of hundreds of millions of people. Port access, cross-border trade, and the growing role of regional integration create opportunities for companies that think beyond a single market.',
            'Investors increasingly view Ethiopia as a hub from which to serve neighbouring markets in manufacturing, logistics, energy, and services. Understanding trade corridors, customs arrangements, and regional demand patterns is essential to capturing these opportunities.',
            'This section will evolve into guides on regional trade, logistics corridors, and market-entry strategies for East Africa, developed in partnership with regional specialists.',
          ],
        },
      ],
    },
  },
  {
    path: 'representative-matters',
    component: StandardPageComponent,
    data: {
      hero: {
        eyebrow: 'Our Work',
        title: 'Representative Matters',
        lead: 'Anonymized engagements delivered by Dinq and its strategic alliance with Kairos Law. Each entry is intentionally client-anonymized — this page stands in for testimonials while the public track record grows.',
        image: '/media/assets/images/hero-addis.jpg',
      },
      sections: [
        {
          id: 'matters',
          eyebrow: 'Selected Engagements',
          heading: 'Selected Engagements',
          kind: 'cards',
          tone: 'light',
          text: 'Representative matters are anonymized and limited to engagements Dinq can substantiate. Outcomes are only added where they can be verified; client names, values, and outcomes are not published unless specifically approved.',
          items: [
            {
              title: 'Cross-Border Market Entry — International Investor',
              situation: 'An international investor required support assessing and establishing operations in Ethiopia.',
              role: 'Supported market-entry planning, local coordination, stakeholder engagement, and implementation workstreams, including coordination with relevant professional advisors.',
            },
            {
              title: 'Corporate Establishment & Regulatory Coordination',
              situation: 'A cross-border business required a coordinated path from structuring decisions to local establishment and regulatory engagement.',
              role: 'Coordinated corporate-structuring workstreams, stakeholder engagement, and implementation support, with legal matters handled by appropriate counsel.',
            },
            {
              title: 'Diaspora Property Acquisition & Stewardship',
              situation: 'A diaspora family required local support in connection with property acquisition and the ongoing management of family assets.',
              role: 'Supported transaction coordination, local follow-up, and planning for longer-term property and asset management.',
            },
            {
              title: 'Investment Project Implementation & Reporting',
              situation: 'An investment project required local implementation support and reliable reporting to stakeholders who were not continuously present in Ethiopia.',
              role: 'Coordinated implementation activities, follow-up, and reporting across the relevant workstreams.',
            },
            {
              title: 'Integrated Advisory + Legal Coordination',
              situation: 'A client mandate required commercial, operational, and legal support across multiple issues.',
              role: 'Coordinated the advisory and implementation relationship while working with Kairos Law on legal workstreams requiring regulated legal services.',
            },
          ],
        },
      ],
    },
  },
  {
    path: 'insights',
    component: InsightsIndexComponent,
  },
  {
    path: 'insights/:slug',
    component: InsightArticleComponent,
  },
  {
    path: 'privacy-policy',
    component: StandardPageComponent,
    // LEGAL REVIEW FLAG (master doc Section 12): placeholder boilerplate only —
    // legal copy to be drafted and reviewed before launch.
    data: {
      hero: {
        eyebrow: 'Legal',
        title: 'Privacy Policy',
        lead: 'How Dinq Advisory Group collects, uses, and protects your information. This is placeholder legal copy for design purposes and must be reviewed by counsel before launch.',
      },
      sections: [
        {
          id: 'overview',
          eyebrow: 'Overview',
          heading: 'Overview',
          kind: 'prose',
          tone: 'light',
          pending: true,
          paragraphs: [
            'This Privacy Policy describes how Dinq Advisory Group ("Dinq", "we", "us") collects, uses, discloses, and protects personal information we receive through this website, including information you provide through our consultation booking and contact forms.',
            'By using this website you acknowledge that you have read and understood this policy. Where we require consent for a particular use, it will be requested explicitly before collection.',
          ],
        },
        {
          id: 'what-we-collect',
          eyebrow: 'Collection',
          heading: 'What We Collect',
          kind: 'prose',
          tone: 'tint',
          pending: true,
          paragraphs: [
            'We collect information you choose to provide, such as your name, email address, phone number, country, and the details of your inquiry when you complete our booking or contact forms.',
            'We may also collect limited technical data automatically, including browser type, device type, IP address, pages visited, and timestamps, to operate and improve the site.',
          ],
        },
        {
          id: 'how-we-use-it',
          eyebrow: 'Use',
          heading: 'How We Use Your Information',
          kind: 'prose',
          tone: 'light',
          pending: true,
          paragraphs: [
            'We use the information you provide to respond to your inquiries, schedule consultations, deliver services, and manage our relationship with you.',
            'We use technical data to maintain, secure, and improve the website and to understand how visitors engage with our content. We do not sell your personal information.',
          ],
        },
        {
          id: 'cookies',
          eyebrow: 'Cookies',
          heading: 'Cookies & Analytics',
          kind: 'prose',
          tone: 'tint',
          pending: true,
          paragraphs: [
            'This website uses cookies and similar technologies to remember preferences and to understand site usage through analytics services. You can control cookies through your browser settings.',
            'Third-party analytics and booking/scheduling tools may set cookies or process data on our behalf. This section will be completed to list each service and its processing details.',
          ],
        },
        {
          id: 'third-parties',
          eyebrow: 'Third Parties',
          heading: 'Third-Party Services',
          kind: 'prose',
          tone: 'light',
          pending: true,
          paragraphs: [
            'We use third-party service providers for website analytics and for the booking/scheduling tool that powers consultation scheduling. These providers process limited data solely to provide those services.',
            'We may also disclose information where required by law or to protect our rights, safety, or property.',
          ],
        },
        {
          id: 'contact',
          eyebrow: 'Your Rights',
          heading: 'Access & Data Requests',
          kind: 'prose',
          tone: 'tint',
          pending: true,
          paragraphs: [
            'You may request access to, correction of, or deletion of your personal information, or ask questions about this policy, by contacting us using the details provided on the Contact page.',
            'We aim to respond to all legitimate data requests within a reasonable time and in accordance with applicable law.',
          ],
        },
      ],
    },
  },
  {
    path: 'terms-of-use',
    component: StandardPageComponent,
    // LEGAL REVIEW FLAG (master doc Section 12): placeholder boilerplate only —
    // terms to be drafted and reviewed by counsel before launch.
    data: {
      hero: {
        eyebrow: 'Legal',
        title: 'Terms of Use',
        lead: 'The terms governing your use of this website. This is placeholder legal copy for design purposes and must be reviewed by counsel before launch.',
      },
      sections: [
        {
          id: 'acceptance',
          eyebrow: 'Agreement',
          heading: 'Acceptance of Terms',
          kind: 'prose',
          tone: 'light',
          pending: true,
          paragraphs: [
            'By accessing or using this website, you agree to be bound by these Terms of Use and all applicable laws and regulations. If you do not agree, please do not use the website.',
            'Dinq reserves the right to revise these terms at any time. Continued use of the website after changes are posted constitutes acceptance of the revised terms.',
          ],
        },
        {
          id: 'content',
          eyebrow: 'Content',
          heading: 'Content & Disclaimer',
          kind: 'prose',
          tone: 'tint',
          pending: true,
          paragraphs: [
            'The content on this website is provided for general informational purposes only and does not constitute legal, financial, or professional advice. You should consult qualified professionals before acting on any information found here.',
            'While we aim to keep information accurate and current, we make no warranties as to its completeness, accuracy, or fitness for a particular purpose.',
          ],
        },
        {
          id: 'use',
          eyebrow: 'Use',
          heading: 'Permitted Use',
          kind: 'prose',
          tone: 'light',
          pending: true,
          paragraphs: [
            'You may use this website for lawful purposes only. You agree not to misuse the website, attempt to gain unauthorized access to its systems, or interfere with its operation.',
            'All intellectual property on this website, including text, graphics, and logos, is owned by Dinq or its licensors and may not be reproduced without permission.',
          ],
        },
        {
          id: 'liability',
          eyebrow: 'Liability',
          heading: 'Limitation of Liability',
          kind: 'prose',
          tone: 'tint',
          pending: true,
          paragraphs: [
            'To the fullest extent permitted by law, Dinq shall not be liable for any direct, indirect, incidental, or consequential damages arising from your use of, or inability to use, this website.',
            'You are responsible for any decisions you make based on content found on this website.',
          ],
        },
        {
          id: 'contact',
          eyebrow: 'Contact',
          heading: 'Contact',
          kind: 'prose',
          tone: 'light',
          pending: true,
          paragraphs: [
            'If you have questions about these Terms of Use, please contact us using the details provided on the Contact page.',
          ],
        },
      ],
    },
  },
  { path: '**', component: NotFoundComponent },
];
