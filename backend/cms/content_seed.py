"""
The page inventory and the home page's migrated copy.

Kept as plain data in one place so it is easy to read against the Angular
components it was lifted from, and so the seed command stays a re-runnable
import rather than a one-off script. Nothing here is imported by the runtime;
`manage.py seed_cms` copies it into the database and the database is then the
source of truth.

Adding a new page to the site means adding a row to PAGES and re-running the
command. Migrating another page's copy means adding a BLOCKS entry keyed by
that page's slug.
"""
from __future__ import annotations

# ---------------------------------------------------------------------------
# Every public page, grouped the way the CMS screen groups its cards.
#
# `order` sorts cards within a category. The inventory is created for all of
# these up front so the CMS screen shows the whole site at once, even where the
# copy still lives in the Angular component and has not been migrated yet.
# ---------------------------------------------------------------------------
PAGES: list[dict] = [
    # Main -------------------------------------------------------------------
    {'slug': 'home', 'title': 'Home', 'route': '/', 'category': 'Main', 'order': 0},
    {'slug': 'contact', 'title': 'Contact', 'route': '/contact', 'category': 'Main', 'order': 10},

    # About ------------------------------------------------------------------
    {'slug': 'about', 'title': 'About', 'route': '/about', 'category': 'About', 'order': 0},
    {'slug': 'who-we-are', 'title': 'Who We Are', 'route': '/about/who-we-are', 'category': 'About', 'order': 10},
    {'slug': 'our-approach', 'title': 'Our Approach', 'route': '/about/our-approach', 'category': 'About', 'order': 20},
    {'slug': 'leadership', 'title': 'Leadership', 'route': '/about/leadership', 'category': 'About', 'order': 30},
    {'slug': 'kairos-law-alliance', 'title': 'Kairos Law Alliance', 'route': '/about/kairos-law-alliance', 'category': 'About', 'order': 40},

    # Solutions --------------------------------------------------------------
    {'slug': 'solutions', 'title': 'Solutions Overview', 'route': '/solutions', 'category': 'Solutions', 'order': 0},
    {'slug': 'solution-international-business-investment-advisory', 'title': 'International Business & Investment Advisory', 'route': '/solutions/international-business-investment-advisory', 'category': 'Solutions', 'order': 10},
    {'slug': 'solution-diaspora-advisory', 'title': 'Diaspora Advisory', 'route': '/solutions/diaspora-advisory', 'category': 'Solutions', 'order': 20},
    {'slug': 'solution-property-asset-management', 'title': 'Property & Asset Management', 'route': '/solutions/property-asset-management', 'category': 'Solutions', 'order': 30},
    {'slug': 'solution-government-institutional-advisory', 'title': 'Government & Institutional Advisory', 'route': '/solutions/government-institutional-advisory', 'category': 'Solutions', 'order': 40},
    {'slug': 'solution-workforce-organizational-advisory', 'title': 'Workforce & Organizational Advisory', 'route': '/solutions/workforce-organizational-advisory', 'category': 'Solutions', 'order': 50},

    # Industries -------------------------------------------------------------
    {'slug': 'industry-real-estate', 'title': 'Real Estate', 'route': '/industries/real-estate', 'category': 'Industries', 'order': 0},
    {'slug': 'industry-manufacturing', 'title': 'Manufacturing', 'route': '/industries/manufacturing', 'category': 'Industries', 'order': 10},
    {'slug': 'industry-mining', 'title': 'Mining', 'route': '/industries/mining', 'category': 'Industries', 'order': 20},
    {'slug': 'industry-infrastructure', 'title': 'Infrastructure', 'route': '/industries/infrastructure', 'category': 'Industries', 'order': 30},
    {'slug': 'industry-energy', 'title': 'Energy', 'route': '/industries/energy', 'category': 'Industries', 'order': 40},
    {'slug': 'industry-agribusiness', 'title': 'Agribusiness', 'route': '/industries/agribusiness', 'category': 'Industries', 'order': 50},
    {'slug': 'industry-technology-digital-business', 'title': 'Technology & Digital Business', 'route': '/industries/technology-digital-business', 'category': 'Industries', 'order': 60},
    {'slug': 'industry-healthcare', 'title': 'Healthcare', 'route': '/industries/healthcare', 'category': 'Industries', 'order': 70},
    {'slug': 'industry-hospitality-tourism', 'title': 'Hospitality & Tourism', 'route': '/industries/hospitality-tourism', 'category': 'Industries', 'order': 80},
    {'slug': 'industry-financial-services', 'title': 'Financial Services', 'route': '/industries/financial-services', 'category': 'Industries', 'order': 90},

    # Insights ---------------------------------------------------------------
    {'slug': 'insights', 'title': 'Insights', 'route': '/insights', 'category': 'Insights', 'order': 0},
    {'slug': 'insight-5-mistakes-foreign-investors-making-entering-ethiopia', 'title': '5 Mistakes Foreign Investors Make Entering Ethiopia', 'route': '/insights/5-mistakes-foreign-investors-making-entering-ethiopia', 'category': 'Insights', 'order': 10},
    {'slug': 'insight-a-diaspora-guide-to-investing-back-home', 'title': 'A Diaspora Guide to Investing Back Home', 'route': '/insights/a-diaspora-guide-to-investing-back-home', 'category': 'Insights', 'order': 20},
    {'slug': 'insight-manufacturing-opportunities-in-ethiopia', 'title': 'Manufacturing Opportunities in Ethiopia', 'route': '/insights/manufacturing-opportunities-in-ethiopia', 'category': 'Insights', 'order': 30},

    # Our Work ---------------------------------------------------------------
    {'slug': 'why-ethiopia', 'title': 'Why Ethiopia', 'route': '/why-ethiopia', 'category': 'Our Work', 'order': 0},
    {'slug': 'representative-matters', 'title': 'Representative Matters', 'route': '/representative-matters', 'category': 'Our Work', 'order': 10},

    # Legal ------------------------------------------------------------------
    {'slug': 'privacy-policy', 'title': 'Privacy Policy', 'route': '/privacy-policy', 'category': 'Legal', 'order': 0},
    {'slug': 'terms-of-use', 'title': 'Terms of Use', 'route': '/terms-of-use', 'category': 'Legal', 'order': 10},
]


# ---------------------------------------------------------------------------
# Home page copy, lifted from home.component.html and home.component.ts.
#
# The "Core Industries" block is deliberately absent: the home page renders it
# through the shared IndustriesSection component, which reads the same
# industries-data.ts as every other industry surface. Editing it here would
# either have no effect or change those pages too, so it stays out of the home
# editor until that data is migrated as its own thing.
# ---------------------------------------------------------------------------
HOME_BLOCKS: list[dict] = [
    # Hero -------------------------------------------------------------------
    {
        'key': 'hero.title',
        'kind': 'text',
        'label': 'Hero — title (first line)',
        'value': 'Global Perspective.',
        'order': 0,
    },
    {
        'key': 'hero.titleAccent',
        'kind': 'text',
        'label': 'Hero — title (accent line)',
        'value': 'Local Execution.',
        'order': 1,
    },
    {
        'key': 'hero.subhead',
        'kind': 'textarea',
        'label': 'Hero — subheading',
        'value': (
            'Helping international businesses, investors, institutions, and members of the '
            'Ethiopian diaspora establish, grow, manage, and protect their interests in Ethiopia.'
        ),
        'order': 2,
    },
    {
        'key': 'hero.proof',
        'kind': 'textarea',
        'label': 'Hero — supporting paragraph',
        'value': (
            'Whether entering a new market, establishing a business, managing investments, or '
            'safeguarding family assets, Dinq provides integrated advisory, implementation support, '
            'coordinated legal services, and long-term stewardship through one trusted relationship.'
        ),
        'order': 3,
    },
    {
        'key': 'hero.ctaPrimary',
        'kind': 'text',
        'label': 'Hero — primary button',
        'value': 'Book a Consultation',
        'order': 4,
    },
    {
        'key': 'hero.ctaSecondary',
        'kind': 'text',
        'label': 'Hero — secondary button',
        'value': 'Explore Our Solutions',
        'order': 5,
    },
    {
        'key': 'hero.image',
        'kind': 'image',
        'label': 'Hero — background image',
        'value': '/media/assets/images/hero-addis.jpg',
        'order': 6,
    },

    # What Dinq Does ---------------------------------------------------------
    {
        'key': 'why.eyebrow',
        'kind': 'text',
        'label': 'What Dinq Does — eyebrow',
        'value': 'What Dinq Does',
        'order': 10,
    },
    {
        'key': 'why.title',
        'kind': 'text',
        'label': 'What Dinq Does — heading',
        'value': 'One relationship, not a patchwork of advisors.',
        'order': 11,
    },
    {
        'key': 'why.body1',
        'kind': 'textarea',
        'label': 'What Dinq Does — paragraph 1',
        'value': (
            'Dinq bridges the gap between international opportunity and successful local execution. '
            'We combine strategic advisory with practical implementation, trusted local representation, '
            'and ongoing support so clients can move from an idea or investment decision to a '
            'well-managed outcome.'
        ),
        'order': 12,
    },
    {
        'key': 'why.body2',
        'kind': 'textarea',
        'label': 'What Dinq Does — paragraph 2',
        'value': (
            'Instead of asking clients to coordinate multiple advisors, Dinq provides one integrated '
            'relationship across commercial strategy, stakeholder engagement, project coordination, '
            'property and asset oversight, and coordinated professional services.'
        ),
        'order': 13,
    },

    # Who We Help ------------------------------------------------------------
    {
        'key': 'partners.eyebrow',
        'kind': 'text',
        'label': 'Who We Help — eyebrow',
        'value': 'Partnership',
        'order': 20,
    },
    {
        'key': 'partners.title',
        'kind': 'text',
        'label': 'Who We Help — heading',
        'value': 'Who We Help',
        'order': 21,
    },
    {
        'key': 'partners.items',
        'kind': 'list',
        'label': 'Who We Help — cards',
        'data': [
            {
                'title': 'International Businesses & Investors',
                'text': 'Multinationals and mid-market companies entering or expanding operations in Ethiopia.',
                'icon': 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-16.5c-1.5 0-3 .6-4.1 1.6M16.1 6.1A8.96 8.96 0 0 1 12 4.5M3.3 9h17.4M3.3 15h17.4M4.9 12.9c2.7 1.2 5.7 1.8 7.1 1.8s4.4-.6 7.1-1.8',
            },
            {
                'title': 'Private Equity & Family Offices',
                'text': 'Institutional and private capital seeking structured, well-governed exposure to Ethiopian opportunities.',
                'icon': 'M2 20V8l5-4 5 4v12M12 20V4l5 4v12M2 20h20M7 12h0M12 12h0M17 12h0',
            },
            {
                'title': 'Ethiopian Diaspora',
                'text': 'Ethiopians abroad investing, relocating, establishing businesses, or protecting family and property interests back home.',
                'icon': 'M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 10v-2a3.5 3.5 0 0 0-2.5-3.3M3 21v-2a3.5 3.5 0 0 1 2.5-3.3',
            },
            {
                'title': 'Governments & Development Institutions',
                'text': 'Public-sector bodies and agencies delivering investment, infrastructure, and development programs.',
                'icon': 'M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6',
            },
            {
                'title': 'NGOs & Multilateral Organizations',
                'text': 'International organizations coordinating programs, partnerships, and operations on the ground.',
                'icon': 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10ZM2 12h20M12 2c2.8 3.1 4.3 7 4.3 10s-1.5 6.9-4.3 10c-2.8-3.1-4.3-7-4.3-10s1.5-6.9 4.3-10Z',
            },
            {
                'title': 'Financial Institutions',
                'text': 'Banks, lenders, and investors requiring local due diligence, structuring, transaction, or implementation support.',
                'icon': 'M2 7h20M2 17h20M6 7v10M10 7v10M14 7v10M18 7v10M2 12h20',
            },
        ],
        'order': 22,
    },

    # Our Solutions ----------------------------------------------------------
    {
        'key': 'solutions.eyebrow',
        'kind': 'text',
        'label': 'Our Solutions — eyebrow',
        'value': 'Our Solutions',
        'order': 30,
    },
    {
        'key': 'solutions.title',
        'kind': 'text',
        'label': 'Our Solutions — heading',
        'value': 'How we serve our clients',
        'order': 31,
    },
    {
        'key': 'solutions.items',
        'kind': 'list',
        'label': 'Our Solutions — list',
        'data': [
            {
                'title': 'International Business & Investment Advisory',
                'text': 'Helping international businesses, investors, and entrepreneurs assess opportunities, enter the Ethiopian market, establish operations, navigate stakeholders and regulations, and move from strategy into implementation.',
                'slug': 'international-business-investment-advisory',
            },
            {
                'title': 'Diaspora Advisory',
                'text': 'A trusted local point of coordination for diaspora clients managing investments, businesses, real estate, family assets, inheritance and succession matters, relocation, and other interests in Ethiopia.',
                'slug': 'diaspora-advisory',
            },
            {
                'title': 'Property & Asset Management',
                'text': 'Professional oversight of property and related physical assets in Ethiopia — from tenant and rent administration to inspections, maintenance, leasing, vendor coordination, improvements, reporting, and local representation.',
                'slug': 'property-asset-management',
            },
            {
                'title': 'Government & Institutional Advisory',
                'text': 'Supporting businesses, NGOs, development organizations, public institutions, and other stakeholders with government coordination, stakeholder engagement, institutional advisory, investment facilitation, and implementation.',
                'slug': 'government-institutional-advisory',
            },
            {
                'title': 'Workforce & Organizational Advisory',
                'text': 'Helping businesses and institutions align organizational structure, workforce capabilities, talent, performance systems, leadership, and HR operations with business strategy and growth.',
                'slug': 'workforce-organizational-advisory',
            },
        ],
        'order': 32,
    },

    # How We Work ------------------------------------------------------------
    {
        'key': 'steps.eyebrow',
        'kind': 'text',
        'label': 'How We Work — eyebrow',
        'value': 'How We Work',
        'order': 40,
    },
    {
        'key': 'steps.items',
        'kind': 'list',
        'label': 'How We Work — steps',
        'data': [
            {
                'title': 'Assess',
                'text': 'We begin by understanding your objectives, identifying opportunities, evaluating risks, and defining a practical roadmap.',
            },
            {
                'title': 'Advise',
                'text': 'We develop commercially sound strategies supported by local market insight and coordinated legal guidance where required.',
            },
            {
                'title': 'Implement',
                'text': 'We help execute the strategy by coordinating stakeholders, engaging with government authorities, managing projects, and supporting transactions.',
            },
            {
                'title': 'Support',
                'text': 'Our relationship continues through ongoing advisory, property and asset management, reporting, governance support, and trusted local representation.',
            },
        ],
        'order': 41,
    },

    # Our Approach -----------------------------------------------------------
    {
        'key': 'approach.eyebrow',
        'kind': 'text',
        'label': 'Our Approach — eyebrow',
        'value': 'Our Approach',
        'order': 50,
    },
    {
        'key': 'approach.title',
        'kind': 'text',
        'label': 'Our Approach — heading',
        'value': 'How Dinq works with clients',
        'order': 51,
    },
    {
        'key': 'approach.intro',
        'kind': 'textarea',
        'label': 'Our Approach — intro',
        'value': (
            'Advice is only valuable when it can be implemented. Dinq is built around the full client '
            'journey: understanding the opportunity, developing the strategy, coordinating the people '
            'and institutions required to execute it, and remaining engaged after the initial transaction.'
        ),
        'order': 52,
    },
    {
        'key': 'approach.items',
        'kind': 'list',
        'label': 'Our Approach — points',
        'data': [
            'One trusted relationship across strategy, execution, local representation, and ongoing support.',
            'International perspective combined with practical Ethiopian market knowledge.',
            'Execution-focused support rather than strategy alone.',
            'Professional accountability and structured reporting for clients who are not always on the ground.',
            'Coordinated legal support through Kairos Law where regulated legal services are required.',
            'Long-term stewardship of investments, projects, property, and other client interests.',
        ],
        'order': 53,
    },

    # Cross-Border Expertise -------------------------------------------------
    {
        'key': 'crossBorder.eyebrow',
        'kind': 'text',
        'label': 'Cross-Border Expertise — eyebrow',
        'value': 'Cross-Border Expertise',
        'order': 60,
    },
    {
        'key': 'crossBorder.body',
        'kind': 'textarea',
        'label': 'Cross-Border Expertise — paragraph',
        'value': (
            'With a presence in Canada and Ethiopia and relationships across key international markets, '
            'Dinq connects global clients with opportunities, expertise, and execution capabilities in '
            'Ethiopia. We are particularly positioned to support clients and diaspora communities across '
            'Canada, the United States, the United Kingdom, Europe, and the Middle East — including '
            'existing relationships originating through Kairos Law — and we support clients and property '
            'owners wherever in the world they are based.'
        ),
        'order': 61,
    },

    # Kairos Alliance --------------------------------------------------------
    {
        'key': 'kairos.title',
        'kind': 'text',
        'label': 'Kairos Alliance — heading',
        'value': 'An Integrated Client Experience',
        'order': 70,
    },
    {
        'key': 'kairos.body1',
        'kind': 'textarea',
        'label': 'Kairos Alliance — paragraph 1',
        'value': (
            'Through our strategic collaboration with Kairos Law, clients benefit from coordinated '
            'business advisory, implementation support, and legal services where required. Dinq leads the '
            'advisory and execution relationship; Kairos Law provides regulated Ethiopian legal services '
            'within its areas of practice.'
        ),
        'order': 71,
    },
    {
        'key': 'kairos.body2',
        'kind': 'textarea',
        'label': 'Kairos Alliance — paragraph 2',
        'value': (
            'The result is a coordinated client experience rather than a collection of disconnected advisors.'
        ),
        'order': 72,
    },
    {
        'key': 'kairos.image',
        'kind': 'image',
        'label': 'Kairos Alliance — background image',
        'value': '/media/assets/images/kairos-alliance.jpg',
        'order': 73,
    },
    {
        'key': 'kairos.logo',
        'kind': 'image',
        'label': 'Kairos Alliance — logo',
        'value': '/media/KAIROS_Logo_White_transparent.png',
        'order': 74,
    },
]

# Migrated copy, keyed by page slug. Only home is done so far; the rest of the
# inventory exists as pages with no blocks, which the CMS screen shows as
# "not yet migrated".
BLOCKS_BY_PAGE: dict[str, list[dict]] = {
    'home': HOME_BLOCKS,
}
