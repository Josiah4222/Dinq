"""
Copy for the six bespoke pages, kept apart from the home page's in
content_seed.py.

These are the pages whose markup lives entirely in a single Angular component
with the copy written inline â€” the about pages and the contact page â€” so their
blocks mirror the shape of the component's own data rather than a
`*-data.ts` object: one block per string the component interpolates, and one
list block per repeating group it renders with @for.

The values are the shipped copy, lifted character for character from the
components. Nothing here is imported by the runtime;
`manage.py seed_cms` copies these into the database and the database is then
the source of truth.

Two conventions worth knowing before reading a list block's `data`:

  - A bullet list is an array of plain strings.
  - A repeating record is an array of objects, each carrying a stable `key`
    alongside its editable fields. The key is what the frontend uses to pair a
    stored row with the static row it came from, so an editor can retitle or
    reorder a row without it silently becoming a different row.

The editor stores flat text per field, so a leadership biography is one value
with its paragraphs separated by blank lines, and a leader's focus areas are
one per line. The components split them back apart for rendering.
"""
from __future__ import annotations

BESPOKE_BLOCKS: dict[str, list[dict]] = {
    # =======================================================================
    # /about
    # =======================================================================
    'about': [
        # Hero -----------------------------------------------------------------
        {
            'key': 'hero.eyebrow',
            'kind': 'text',
            'label': 'Hero â€” eyebrow',
            'value': 'About Dinq Advisory Group',
            'order': 0,
        },
        {
            'key': 'hero.title',
            'kind': 'text',
            'label': 'Hero â€” title',
            'value': 'Connecting Opportunity Across Borders.',
            'order': 1,
        },
        {
            'key': 'hero.image',
            'kind': 'image',
            'label': 'Hero â€” background image',
            'value': '/media/assets/images/hero-addis.jpg',
            'order': 2,
        },

        # Who We Are ----------------------------------------------------------
        {
            'key': 'whoWeAre.eyebrow',
            'kind': 'text',
            'label': 'Who We Are â€” eyebrow',
            'value': 'Who We Are',
            'order': 10,
        },
        {
            'key': 'whoWeAre.heading',
            'kind': 'text',
            'label': 'Who We Are â€” heading',
            'value': 'An integrated cross-border advisory firm',
            'order': 11,
        },
        {
            'key': 'whoWeAre.paragraphs',
            'kind': 'list',
            'label': 'Who We Are â€” paragraphs',
            'data': [
                'Dinq Advisory Group is an integrated cross-border advisory firm helping international '
                'businesses, investors, institutions, and members of the Ethiopian diaspora successfully '
                'invest, establish, operate, and manage their interests in Ethiopia.',
                'Unlike traditional consulting firms that stop at strategy, or professional service '
                'providers that address only one part of a mandate, Dinq supports the complete journey â€” '
                'from opportunity assessment and strategic planning to implementation, coordination, local '
                'representation, and ongoing asset stewardship.',
                'Working in strategic collaboration with Kairos Law where legal services are required, Dinq '
                'combines commercial advisory, local execution, and coordinated professional support into '
                'one integrated client experience. Our clients gain more than advice: they gain a trusted '
                'partner on the ground.',
            ],
            'order': 12,
        },
        {
            'key': 'whoWeAre.tagline',
            'kind': 'text',
            'label': 'Who We Are â€” tagline',
            'value': 'Connecting Opportunity Across Borders.',
            'order': 13,
        },

        # Vision & Mission ----------------------------------------------------
        {
            'key': 'vision.eyebrow',
            'kind': 'text',
            'label': 'Vision â€” eyebrow',
            'value': 'Our Vision',
            'order': 20,
        },
        {
            'key': 'vision.text',
            'kind': 'textarea',
            'label': 'Vision â€” statement',
            'value': (
                'To become a leading cross-border advisory firm connecting international capital, expertise, '
                'and opportunity with Ethiopia and the broader East African region through trusted '
                'relationships, practical execution, and long-term value creation.'
            ),
            'order': 21,
        },
        {
            'key': 'mission.eyebrow',
            'kind': 'text',
            'label': 'Mission â€” eyebrow',
            'value': 'Our Mission',
            'order': 22,
        },
        {
            'key': 'mission.text',
            'kind': 'textarea',
            'label': 'Mission â€” statement',
            'value': (
                'To simplify investing, doing business, and managing assets in Ethiopia by providing '
                'integrated strategic advisory, implementation support, and coordinated professional '
                'solutions through one trusted relationship.'
            ),
            'order': 23,
        },

        # Purpose -------------------------------------------------------------
        {
            'key': 'purpose.eyebrow',
            'kind': 'text',
            'label': 'Purpose â€” eyebrow',
            'value': 'Our Purpose',
            'order': 30,
        },
        {
            'key': 'purpose.heading',
            'kind': 'text',
            'label': 'Purpose â€” heading',
            'value': 'To bridge the gap between international opportunity and successful local execution.',
            'order': 31,
        },
        {
            'key': 'purpose.paragraphs',
            'kind': 'list',
            'label': 'Purpose â€” paragraphs',
            'data': [
                'Many organizations have strong ideas. Many investors have capital. Many members of the '
                'diaspora want to invest, contribute, or protect what they have built. The challenge is '
                'often execution: finding a trusted team that understands both international expectations '
                'and the realities of operating locally.',
                'Dinq exists to bridge that gap.',
            ],
            'order': 32,
        },

        # Our Values ----------------------------------------------------------
        {
            'key': 'values.eyebrow',
            'kind': 'text',
            'label': 'Our Values â€” eyebrow',
            'value': 'Our Values',
            'order': 40,
        },
        {
            'key': 'values.heading',
            'kind': 'text',
            'label': 'Our Values â€” heading',
            'value': 'What guides every engagement',
            'order': 41,
        },
        {
            'key': 'values.items',
            'kind': 'list',
            'label': 'Our Values â€” values',
            'data': [
                {
                    'key': 'integrity',
                    'title': 'Integrity',
                    'text': 'We build trust through transparency, professionalism, and ethical decision-making.',
                },
                {
                    'key': 'partnership',
                    'title': 'Partnership',
                    'text': 'We succeed when our clients succeed.',
                },
                {
                    'key': 'excellence',
                    'title': 'Excellence',
                    'text': 'We pursue exceptional outcomes through disciplined execution and attention to detail.',
                },
                {
                    'key': 'collaboration',
                    'title': 'Collaboration',
                    'text': 'The best solutions come from combining expertise across disciplines.',
                },
                {
                    'key': 'practicality',
                    'title': 'Practicality',
                    'text': 'Advice only creates value when it can be successfully implemented.',
                },
                {
                    'key': 'stewardship',
                    'title': 'Stewardship',
                    'text': 'We approach each client\'s business, investment, and assets with care, '
                    'accountability, and a long-term perspective.',
                },
            ],
            'order': 42,
        },

        # How We Work ---------------------------------------------------------
        {
            'key': 'steps.eyebrow',
            'kind': 'text',
            'label': 'How We Work â€” eyebrow',
            'value': 'How We Work',
            'order': 50,
        },
        {
            'key': 'steps.heading',
            'kind': 'text',
            'label': 'How We Work â€” heading',
            'value': 'A complete journey, not a one-off engagement',
            'order': 51,
        },
        {
            'key': 'steps.items',
            'kind': 'list',
            'label': 'How We Work â€” steps',
            'data': [
                {
                    'key': 'assess',
                    'title': 'Assess',
                    'text': 'We understand objectives, identify opportunities, evaluate risks, and define a practical roadmap.',
                },
                {
                    'key': 'advise',
                    'title': 'Advise',
                    'text': 'We develop commercially sound strategies supported by local market insight and '
                    'coordinated legal guidance where required.',
                },
                {
                    'key': 'implement',
                    'title': 'Implement',
                    'text': 'We coordinate stakeholders, engage authorities, manage projects, and support '
                    'transactions and execution.',
                },
                {
                    'key': 'support',
                    'title': 'Support',
                    'text': 'We remain engaged through ongoing advisory, reporting, governance support, '
                    'property and asset management, and trusted local representation.',
                },
            ],
            'order': 52,
        },

        # Our Approach --------------------------------------------------------
        {
            'key': 'approach.eyebrow',
            'kind': 'text',
            'label': 'Our Approach â€” eyebrow',
            'value': 'Our Approach',
            'order': 60,
        },
        {
            'key': 'approach.heading',
            'kind': 'text',
            'label': 'Our Approach â€” heading',
            'value': 'One Relationship. From Strategy to Execution.',
            'order': 61,
        },
        {
            'key': 'approach.intro',
            'kind': 'list',
            'label': 'Our Approach â€” intro',
            'data': [
                'Entering a new market, investing from abroad, or managing assets remotely can require '
                'lawyers, consultants, government contacts, technical specialists, property managers, and '
                'local representatives. When these parties operate independently, the client is left to '
                'coordinate the process.',
                'Dinq is designed to solve that problem. We act as the central advisory and implementation '
                'relationship â€” helping clients understand the opportunity, make informed decisions, '
                'coordinate the right expertise, execute locally, and remain informed over time.',
            ],
            'order': 62,
        },
        {
            'key': 'approach.pillars',
            'kind': 'list',
            'label': 'Our Approach â€” pillars',
            'data': [
                {
                    'key': 'international-perspective-local-execution',
                    'title': 'International Perspective + Local Execution',
                    'text': 'We understand the expectations of international clients while working within the '
                    'commercial and institutional realities of Ethiopia.',
                },
                {
                    'key': 'advice-implementation',
                    'title': 'Advice + Implementation',
                    'text': 'We do not treat a strategy document as the end of the engagement. Where '
                    'appropriate, we help turn the strategy into action.',
                },
                {
                    'key': 'local-presence-accountability',
                    'title': 'Local Presence + Professional Accountability',
                    'text': 'Clients who cannot be on the ground need more than informal assistance. Dinq '
                    'provides structured coordination, communication, and reporting.',
                },
                {
                    'key': 'integrated-professional-support',
                    'title': 'Integrated Professional Support',
                    'text': 'When legal or specialized professional work is required, Dinq coordinates the '
                    'relevant expertise rather than leaving the client to assemble the team alone.',
                },
                {
                    'key': 'long-term-stewardship',
                    'title': 'Long-Term Stewardship',
                    'text': 'Our work can continue after market entry, acquisition, or project launch through '
                    'ongoing advisory, asset oversight, reporting, and local representation.',
                },
            ],
            'order': 63,
        },
        {
            'key': 'approach.cta',
            'kind': 'text',
            'label': 'Our Approach â€” button',
            'value': 'Speak With Dinq',
            'order': 64,
        },

        # Kairos Alliance -----------------------------------------------------
        {
            'key': 'alliance.logo',
            'kind': 'image',
            'label': 'Kairos Alliance â€” logo',
            'value': '/media/KAIROS_Logo_White_transparent.png',
            'order': 70,
        },
        {
            'key': 'alliance.label',
            'kind': 'text',
            'label': 'Kairos Alliance â€” label',
            'value': 'Strategic Legal Partner',
            'order': 71,
        },
        {
            'key': 'alliance.eyebrow',
            'kind': 'text',
            'label': 'Kairos Alliance â€” eyebrow',
            'value': 'Strategic Alliance',
            'order': 72,
        },
        {
            'key': 'alliance.heading',
            'kind': 'text',
            'label': 'Kairos Alliance â€” heading',
            'value': 'An Integrated Client Experience',
            'order': 73,
        },
        {
            'key': 'alliance.paragraphs',
            'kind': 'list',
            'label': 'Kairos Alliance â€” paragraphs',
            'data': [
                'Cross-border business and investment mandates frequently involve both commercial decisions '
                'and regulated legal work. Through Dinq\'s strategic collaboration with Kairos Law, clients '
                'can receive coordinated advisory, implementation, and legal support without having to manage '
                'disconnected workstreams themselves.',
                'Dinq remains the advisory and execution lead. Kairos Law provides Ethiopian legal services '
                'where required and within its professional mandate. The two teams coordinate around the '
                'client\'s objectives, while maintaining the appropriate professional roles and responsibilities.',
            ],
            'order': 74,
        },
        {
            'key': 'alliance.benefitsHeading',
            'kind': 'text',
            'label': 'Kairos Alliance â€” benefits heading',
            'value': 'What This Means for Clients',
            'order': 75,
        },
        {
            'key': 'alliance.benefits',
            'kind': 'list',
            'label': 'Kairos Alliance â€” benefits',
            'data': [
                'A coordinated strategy across commercial and legal workstreams.',
                'Fewer disconnected handoffs between advisors.',
                'Clearer implementation sequencing and stakeholder coordination.',
                'Access to legal support when a mandate requires it.',
                'A single client-centred approach focused on practical execution.',
            ],
            'order': 76,
        },

        # Why "Dinq"? --------------------------------------------------------
        {
            'key': 'whyDinq.amharic',
            'kind': 'text',
            'label': 'Why Dinq â€” Amharic word',
            'value': 'á‹µáŠ•á‰…',
            'order': 80,
        },
        {
            'key': 'whyDinq.eyebrow',
            'kind': 'text',
            'label': 'Why Dinq â€” eyebrow',
            'value': 'Why â€œDinqâ€?',
            'order': 81,
        },
        {
            'key': 'whyDinq.text',
            'kind': 'textarea',
            'label': 'Why Dinq â€” paragraph',
            'value': (
                'The name Dinq comes from the Amharic word á‹µáŠ•á‰…, meaning extraordinary, remarkable, or a '
                'marvel. It reflects our commitment to exceptional outcomes while honoring our deep '
                'connection to Ethiopia. For us, â€œDinqâ€ is not simply a name; it represents the standard we '
                'aim to bring to every engagement through sound judgment, trusted execution, and enduring '
                'partnerships.'
            ),
            'order': 82,
        },
        {
            'key': 'whyDinq.footerNote',
            'kind': 'text',
            'label': 'Why Dinq â€” footnote',
            'value': 'Dinq (á‹µáŠ•á‰…) is Amharic for extraordinary or remarkable â€” the standard we bring to every engagement.',
            'order': 83,
        },
    ],

    # =======================================================================
    # /about/who-we-are
    # =======================================================================
    'who-we-are': [
        # Hero -----------------------------------------------------------------
        {
            'key': 'hero.eyebrow',
            'kind': 'text',
            'label': 'Hero â€” eyebrow',
            'value': 'About Dinq Advisory Group',
            'order': 0,
        },
        {
            'key': 'hero.title',
            'kind': 'text',
            'label': 'Hero â€” title',
            'value': 'Who We Are',
            'order': 1,
        },
        {
            'key': 'hero.image',
            'kind': 'image',
            'label': 'Hero â€” background image',
            'value': '/media/assets/images/hero-addis.jpg',
            'order': 2,
        },

        # Who We Are ----------------------------------------------------------
        {
            'key': 'whoWeAre.eyebrow',
            'kind': 'text',
            'label': 'Who We Are â€” eyebrow',
            'value': 'Who We Are',
            'order': 10,
        },
        {
            'key': 'whoWeAre.heading',
            'kind': 'text',
            'label': 'Who We Are â€” heading',
            'value': 'An integrated cross-border advisory firm',
            'order': 11,
        },
        {
            'key': 'whoWeAre.paragraphs',
            'kind': 'list',
            'label': 'Who We Are â€” paragraphs',
            'data': [
                'Dinq Advisory Group is an integrated cross-border advisory firm helping international '
                'businesses, investors, institutions, and members of the Ethiopian diaspora successfully '
                'invest, establish, operate, and manage their interests in Ethiopia.',
                'Unlike traditional consulting firms that stop at strategy, or professional service '
                'providers that address only one part of a mandate, Dinq supports the complete journey â€” '
                'from opportunity assessment and strategic planning to implementation, coordination, local '
                'representation, and ongoing asset stewardship.',
                'Working in strategic collaboration with Kairos Law where legal services are required, Dinq '
                'combines commercial advisory, local execution, and coordinated professional support into '
                'one integrated client experience. Our clients gain more than advice: they gain a trusted '
                'partner on the ground.',
            ],
            'order': 12,
        },
        {
            'key': 'whoWeAre.tagline',
            'kind': 'text',
            'label': 'Who We Are â€” tagline',
            'value': 'Connecting Opportunity Across Borders.',
            'order': 13,
        },

        # Vision & Mission ----------------------------------------------------
        {
            'key': 'vision.eyebrow',
            'kind': 'text',
            'label': 'Vision â€” eyebrow',
            'value': 'Our Vision',
            'order': 20,
        },
        {
            'key': 'vision.text',
            'kind': 'textarea',
            'label': 'Vision â€” statement',
            'value': (
                'To become a leading cross-border advisory firm connecting international capital, expertise, '
                'and opportunity with Ethiopia and the broader East African region through trusted '
                'relationships, practical execution, and long-term value creation.'
            ),
            'order': 21,
        },
        {
            'key': 'mission.eyebrow',
            'kind': 'text',
            'label': 'Mission â€” eyebrow',
            'value': 'Our Mission',
            'order': 22,
        },
        {
            'key': 'mission.text',
            'kind': 'textarea',
            'label': 'Mission â€” statement',
            'value': (
                'To simplify investing, doing business, and managing assets in Ethiopia by providing '
                'integrated strategic advisory, implementation support, and coordinated professional '
                'solutions through one trusted relationship.'
            ),
            'order': 23,
        },

        # Purpose -------------------------------------------------------------
        {
            'key': 'purpose.eyebrow',
            'kind': 'text',
            'label': 'Purpose â€” eyebrow',
            'value': 'Our Purpose',
            'order': 30,
        },
        {
            'key': 'purpose.heading',
            'kind': 'text',
            'label': 'Purpose â€” heading',
            'value': 'To bridge the gap between international opportunity and successful local execution.',
            'order': 31,
        },
        {
            'key': 'purpose.paragraphs',
            'kind': 'list',
            'label': 'Purpose â€” paragraphs',
            'data': [
                'Many organizations have strong ideas. Many investors have capital. Many members of the '
                'diaspora want to invest, contribute, or protect what they have built. The challenge is '
                'often execution: finding a trusted team that understands both international expectations '
                'and the realities of operating locally.',
                'Dinq exists to bridge that gap.',
            ],
            'order': 32,
        },

        # Our Values ----------------------------------------------------------
        {
            'key': 'values.eyebrow',
            'kind': 'text',
            'label': 'Our Values â€” eyebrow',
            'value': 'Our Values',
            'order': 40,
        },
        {
            'key': 'values.heading',
            'kind': 'text',
            'label': 'Our Values â€” heading',
            'value': 'What guides every engagement',
            'order': 41,
        },
        {
            'key': 'values.items',
            'kind': 'list',
            'label': 'Our Values â€” values',
            'data': [
                {
                    'key': 'integrity',
                    'title': 'Integrity',
                    'text': 'We build trust through transparency, professionalism, and ethical decision-making.',
                },
                {
                    'key': 'partnership',
                    'title': 'Partnership',
                    'text': 'We succeed when our clients succeed.',
                },
                {
                    'key': 'excellence',
                    'title': 'Excellence',
                    'text': 'We pursue exceptional outcomes through disciplined execution and attention to detail.',
                },
                {
                    'key': 'collaboration',
                    'title': 'Collaboration',
                    'text': 'The best solutions come from combining expertise across disciplines.',
                },
                {
                    'key': 'practicality',
                    'title': 'Practicality',
                    'text': 'Advice only creates value when it can be successfully implemented.',
                },
                {
                    'key': 'stewardship',
                    'title': 'Stewardship',
                    'text': 'We approach each client\'s business, investment, and assets with care, '
                    'accountability, and a long-term perspective.',
                },
            ],
            'order': 42,
        },

        # How We Work ---------------------------------------------------------
        {
            'key': 'howWeWork.eyebrow',
            'kind': 'text',
            'label': 'How We Work â€” eyebrow',
            'value': 'How We Work',
            'order': 50,
        },
        {
            'key': 'howWeWork.heading',
            'kind': 'text',
            'label': 'How We Work â€” heading',
            'value': 'A complete journey, not a one-off engagement',
            'order': 51,
        },
        {
            'key': 'howWeWork.paragraphs',
            'kind': 'list',
            'label': 'How We Work â€” paragraphs',
            'data': [
                'Dinq is designed around the full arc of a cross-border engagement. We do not hand off after '
                'the strategy â€” we remain engaged to help clients execute locally, stay informed, and protect '
                'what they have built. Every engagement follows the same four-step journey, from first '
                'assessment through long-term stewardship.',
            ],
            'order': 52,
        },
        {
            'key': 'cta.text',
            'kind': 'text',
            'label': 'How We Work â€” button',
            'value': 'Speak With Dinq',
            'order': 53,
        },

        # Why "Dinq"? --------------------------------------------------------
        {
            'key': 'whyDinq.amharic',
            'kind': 'text',
            'label': 'Why Dinq â€” Amharic word',
            'value': 'á‹µáŠ•á‰…',
            'order': 60,
        },
        {
            'key': 'whyDinq.eyebrow',
            'kind': 'text',
            'label': 'Why Dinq â€” eyebrow',
            'value': 'Why â€œDinqâ€?',
            'order': 61,
        },
        {
            'key': 'whyDinq.text',
            'kind': 'textarea',
            'label': 'Why Dinq â€” paragraph',
            'value': (
                'The name Dinq comes from the Amharic word á‹µáŠ•á‰…, meaning extraordinary, remarkable, or a '
                'marvel. It reflects our commitment to exceptional outcomes while honoring our deep '
                'connection to Ethiopia. For us, â€œDinqâ€ is not simply a name; it represents the standard we '
                'aim to bring to every engagement through sound judgment, trusted execution, and enduring '
                'partnerships.'
            ),
            'order': 62,
        },
        {
            'key': 'whyDinq.footerNote',
            'kind': 'text',
            'label': 'Why Dinq â€” footnote',
            'value': 'Dinq (á‹µáŠ•á‰…) is Amharic for extraordinary or remarkable â€” the standard we bring to every engagement.',
            'order': 63,
        },
    ],

    # =======================================================================
    # /about/our-approach
    # =======================================================================
    'our-approach': [
        # Hero -----------------------------------------------------------------
        {
            'key': 'hero.eyebrow',
            'kind': 'text',
            'label': 'Hero â€” eyebrow',
            'value': 'About Dinq Advisory Group',
            'order': 0,
        },
        {
            'key': 'hero.title',
            'kind': 'text',
            'label': 'Hero â€” title',
            'value': 'Our Approach',
            'order': 1,
        },
        {
            'key': 'hero.image',
            'kind': 'image',
            'label': 'Hero â€” background image',
            'value': '/media/assets/images/hero-addis.jpg',
            'order': 2,
        },

        # Approach ------------------------------------------------------------
        {
            'key': 'approach.eyebrow',
            'kind': 'text',
            'label': 'Our Approach â€” eyebrow',
            'value': 'Our Approach',
            'order': 10,
        },
        {
            'key': 'approach.heading',
            'kind': 'text',
            'label': 'Our Approach â€” heading',
            'value': 'One Relationship. From Strategy to Execution.',
            'order': 11,
        },
        {
            'key': 'approach.intro',
            'kind': 'list',
            'label': 'Our Approach â€” intro',
            'data': [
                'Entering a new market, investing from abroad, or managing assets remotely can require '
                'lawyers, consultants, government contacts, technical specialists, property managers, and '
                'local representatives. When these parties operate independently, the client is left to '
                'coordinate the process.',
                'Dinq is designed to solve that problem. We act as the central advisory and implementation '
                'relationship â€” helping clients understand the opportunity, make informed decisions, '
                'coordinate the right expertise, execute locally, and remain informed over time.',
            ],
            'order': 12,
        },
        {
            'key': 'approach.pillars',
            'kind': 'list',
            'label': 'Our Approach â€” pillars',
            'data': [
                {
                    'key': 'international-perspective-local-execution',
                    'title': 'International Perspective + Local Execution',
                    'text': 'We understand the expectations of international clients while working within the '
                    'commercial and institutional realities of Ethiopia.',
                },
                {
                    'key': 'advice-implementation',
                    'title': 'Advice + Implementation',
                    'text': 'We do not treat a strategy document as the end of the engagement. Where '
                    'appropriate, we help turn the strategy into action.',
                },
                {
                    'key': 'local-presence-accountability',
                    'title': 'Local Presence + Professional Accountability',
                    'text': 'Clients who cannot be on the ground need more than informal assistance. Dinq '
                    'provides structured coordination, communication, and reporting.',
                },
                {
                    'key': 'integrated-professional-support',
                    'title': 'Integrated Professional Support',
                    'text': 'When legal or specialized professional work is required, Dinq coordinates the '
                    'relevant expertise rather than leaving the client to assemble the team alone.',
                },
                {
                    'key': 'long-term-stewardship',
                    'title': 'Long-Term Stewardship',
                    'text': 'Our work can continue after market entry, acquisition, or project launch through '
                    'ongoing advisory, asset oversight, reporting, and local representation.',
                },
            ],
            'order': 13,
        },
        {
            'key': 'approach.cta',
            'kind': 'text',
            'label': 'Our Approach â€” button',
            'value': 'Speak With Dinq',
            'order': 14,
        },
    ],

    # =======================================================================
    # /about/leadership
    # =======================================================================
    'leadership': [
        # Hero -----------------------------------------------------------------
        {
            'key': 'hero.eyebrow',
            'kind': 'text',
            'label': 'Hero â€” eyebrow',
            'value': 'Our Team',
            'order': 0,
        },
        {
            'key': 'hero.title',
            'kind': 'text',
            'label': 'Hero â€” title',
            'value': 'Leadership',
            'order': 1,
        },
        {
            'key': 'hero.image',
            'kind': 'image',
            'label': 'Hero â€” background image',
            'value': '/media/assets/images/hero-addis.jpg',
            'order': 2,
        },

        # Overview ------------------------------------------------------------
        {
            'key': 'intro.eyebrow',
            'kind': 'text',
            'label': 'Overview â€” eyebrow',
            'value': 'Introduction',
            'order': 10,
        },
        {
            'key': 'intro.heading',
            'kind': 'text',
            'label': 'Overview â€” heading',
            'value': 'International perspective. Ethiopian expertise. Practical execution.',
            'order': 11,
        },
        {
            'key': 'intro.paragraphs',
            'kind': 'list',
            'label': 'Overview â€” paragraphs',
            'data': [
                'Dinq\'s leadership brings together cross-border business and investment experience with deep '
                'expertise in Ethiopia\'s legal, regulatory, tax, institutional, and workforce environment. '
                'Our multidisciplinary approach reflects how complex investments and business decisions '
                'actually work: commercial strategy, regulation, people, institutions, and implementation '
                'are interconnected.',
                'Together, our leadership team helps clients assess opportunities, navigate complexity, '
                'establish the right structures, and move from strategy to execution.',
            ],
            'order': 12,
        },

        # Team header ---------------------------------------------------------
        {
            'key': 'team.eyebrow',
            'kind': 'text',
            'label': 'Team â€” eyebrow',
            'value': 'The Team',
            'order': 20,
        },
        {
            'key': 'team.heading',
            'kind': 'text',
            'label': 'Team â€” heading',
            'value': 'Meet the leadership',
            'order': 21,
        },
        {
            'key': 'team.meta',
            'kind': 'text',
            'label': 'Team â€” directory note',
            'value': 'Leadership Directory',
            'order': 22,
        },
        {
            'key': 'team.plateLabel',
            'kind': 'text',
            'label': 'Team â€” practice plate label',
            'value': 'Practice',
            'order': 23,
        },
        {
            'key': 'team.focusLabel',
            'kind': 'text',
            'label': 'Team â€” focus label',
            'value': 'Areas of Focus',
            'order': 24,
        },
        {
            'key': 'team.expandLabel',
            'kind': 'text',
            'label': 'Team â€” collapsed biography button',
            'value': 'View full bio',
            'order': 25,
        },
        {
            'key': 'team.collapseLabel',
            'kind': 'text',
            'label': 'Team â€” expanded biography button',
            'value': 'Show less',
            'order': 26,
        },

        # Leadership bios -----------------------------------------------------
        {
            'key': 'leadership.members',
            'kind': 'list',
            'label': 'Leadership â€” biographies',
            'data': [
                {
                    'key': 'abel-giratta',
                    'name': 'Abel Giratta',
                    'role': 'Founder & Managing Director',
            # Contact links, one per icon under the photo. Seeded empty on
            # purpose: nobody has vetted a profile URL yet, and an invented one
            # would put a dead link in front of a client. They sit high in the
            # row because the editor renders a leader's fields in this order and
            # a link buried under a long biography is a link nobody fills in.
            'linkedin': '',
            'email': '',
                    'image': '/media/assets/images/Abel.jpg',
                    'org': 'Dinq Advisory Group Â· Kairos Law',
                    'bio': '\n\n'.join([
                        'Abel Giratta is the Founder and Managing Director of Dinq Advisory Group, where he '
                        'leads the firm\'s cross-border strategy, international business and investment '
                        'advisory, and growth initiatives. He also serves as Partner & Head of Real Estate '
                        'and International Advisory at Kairos Law Firm in Addis Ababa, giving him a direct '
                        'operating role across both the international and Ethiopian sides of Dinq\'s advisory '
                        'model.',
                        'A Canadian lawyer, entrepreneur, and strategic advisor, Abel brings more than a '
                        'decade of experience spanning law, real estate, business advisory, and '
                        'entrepreneurship, complemented by earlier experience in financial services and '
                        'firsthand field experience in Canada\'s oil and gas drilling industry across Alberta, '
                        'Saskatchewan, and Northern Canada. His career has given him experience on both sides '
                        'of the advisory relationshipâ€”as a professional advising clients and as an '
                        'entrepreneur building and operating businesses.',
                        'Called to the Ontario Bar in 2015, Abel later founded Giratta Law Professional '
                        'Corporation, building and operating a multidisciplinary legal practice serving '
                        'individuals, entrepreneurs, businesses, and investors across real estate, corporate '
                        'and commercial, immigration, and cross-border matters. Beyond legal practice, '
                        'building the firm gave him direct experience in business development, client '
                        'acquisition, operations, team management, and strategic decision-makingâ€”experience '
                        'that now informs his approach to advising businesses and investors through Dinq.',
                        'Through Dinq, Abel brings these experiences together to help international '
                        'businesses, investors, institutions, and members of the Ethiopian diaspora '
                        'establish, invest, operate, and manage interests in Ethiopia. His work spans '
                        'market-entry strategy, business establishment, investment and real estate advisory, '
                        'strategic partnerships, stakeholder coordination, and the execution of complex '
                        'cross-border mandates.',
                        'Dividing his time between Canada and Ethiopia, Abel brings an understanding of '
                        'international professional and commercial expectations together with an increasingly '
                        'deep knowledge of Ethiopia\'s business environment and the realities of local '
                        'execution. His role at Dinq is to bridge those environmentsâ€”helping clients move from '
                        'opportunity and strategy to implementation and long-term value.',
                    ]),
                    'focus': '\n'.join([
                        'Cross-Border Strategy',
                        'International Business & Investment',
                        'Market Entry & Implementation',
                        'Real Estate & Asset Advisory',
                        'Strategic Partnerships',
                        'Diaspora Advisory',
                    ]),
                },
                {
                    'key': 'habtamu-bazezew',
                    'name': 'Habtamu Bazezew',
                    'role': 'Partner & Legal Strategy Advisor',
            'linkedin': '',
            'email': '',
                    'image': '/media/assets/images/habtamu.jpg',
                    'org': 'Managing Partner, Kairos Law Firm',
                    'bio': '\n\n'.join([
                        'Habtamu Bazezew is a senior Ethiopian legal practitioner, entrepreneur, and strategic '
                        'advisor with more than 17 years of experience advising businesses, institutions, '
                        'NGOs, and individuals on complex legal, regulatory, employment, and commercial '
                        'matters.',
                        'He is the founder of the legal practice that evolved into Kairos Law Firm, where he '
                        'now serves as Managing Partner. Over nearly two decades of independent practice, '
                        'Habtamu has developed substantial experience in employment and labour matters, '
                        'commercial disputes and litigation, NGO and institutional advisory, construction and '
                        'infrastructure matters, and regulatory compliance. His work includes advising '
                        'employers and organizations on workplace disputes, employment risk, organizational '
                        'policies and compliance, as well as representing clients in significant commercial '
                        'disputes and litigation.',
                        'A significant part of Habtamu\'s practice has involved advising international and '
                        'local NGOs and institutions operating in Ethiopia, including establishment and '
                        'registration, regulatory compliance, employment, governance, and ongoing operational '
                        'legal requirements. This work has given him extensive experience navigating '
                        'Ethiopia\'s legal and institutional environment and engaging with government bodies, '
                        'regulators, businesses, and other stakeholders.',
                        'At Dinq, Habtamu brings this legal and institutional perspective to investment, '
                        'market-entry, organizational, and institutional mandates. He contributes particularly '
                        'to Dinq\'s International Business & Investment, Workforce & Organizational, and '
                        'Government & Institutional Advisory practices, helping clients integrate legal and '
                        'regulatory considerations into broader commercial and implementation strategies.',
                        'Habtamu also serves as the strategic bridge between Dinq and Kairos Law. Where '
                        'regulated Ethiopian legal services are required, they are provided separately '
                        'through Kairos, allowing clients to benefit from coordinated advisory, '
                        'implementation, and legal support while maintaining the appropriate distinction between '
                        'Dinq\'s advisory role and legal representation.',
                    ]),
                    'focus': '\n'.join([
                        'Legal Strategy',
                        'Employment & Labour',
                        'NGO & Institutional Advisory',
                        'Commercial Disputes & Litigation',
                        'Regulatory Matters',
                        'Construction & Infrastructure',
                    ]),
                },
                {
                    'key': 'ida-edo',
                    'name': 'Ida Edo',
                    'role': 'Director, Workforce & Organizational Advisory',
            'linkedin': '',
            'email': '',
                    # No portrait supplied: the empty value renders the monogram plate.
                    'image': '',
                    'org': 'Workforce & Organizational Advisory',
                    'bio': '\n\n'.join([
                        'Ida Edo is a senior human resources and organizational advisory professional with '
                        'more than 10 years of experience helping organizations strengthen their workforce, '
                        'talent practices, and people operations. Her experience spans workforce planning, '
                        'talent management, recruitment, employee relations, performance management, '
                        'organizational change, and HR operations.',
                        'Her career includes roles with Shopify, the University of Toronto, Tata, and Aon '
                        'Hewitt. At Shopify, Ida partnered with leaders and HR teams on talent and performance '
                        'management, employee engagement, leadership development, organizational change, '
                        'workforce planning, and operational improvement. At the University of Toronto, she '
                        'advised approximately 40 client groups on recruitment and workforce planning and '
                        'supported the implementation of HR systems.',
                        'At Dinq, Ida leads the Workforce & Organizational Advisory practice, helping '
                        'businesses and institutions align their people, organizational structures, and '
                        'workforce capabilities with broader business strategy. She works with organizations '
                        'entering, expanding, restructuring, or strengthening operations in Ethiopia, with a '
                        'focus on building the organizational capacity and people systems required for '
                        'effective execution and sustainable growth.',
                        'Ida is a Certified Human Resources Professional and has completed the HRPA '
                        'Employment Law examination.',
                    ]),
                    'focus': '\n'.join([
                        'Workforce Strategy',
                        'Organizational Effectiveness',
                        'Talent Management',
                        'HR Transformation',
                        'Performance & Leadership Development',
                    ]),
                },
                {
                    'key': 'kalkidan-hailemariam',
                    'name': 'Kalkidan Hailemariam',
                    'role': 'Senior Advisor, Tax, Customs & Regulatory Affairs',
            'linkedin': '',
            'email': '',
                    'image': '/media/assets/images/Kalkidan H.jpg',
                    'org': 'Dinq Advisory Group',
                    'bio': '\n\n'.join([
                        'Kalkidan Hailemariam is a senior legal and regulatory advisor with extensive '
                        'experience across Ethiopia\'s tax, customs, regulatory, and public-sector environment. '
                        'Her career spans senior roles within the Ethiopian Revenues and Customs Authority, '
                        'the Federal Attorney General\'s Office, and leading private-sector organizations.',
                        'At the Ethiopian Revenues and Customs Authority, Kalkidan advised on tax law, handled '
                        'tax disputes, and held responsibilities in customs enforcement. This experience gave '
                        'her firsthand insight into how Ethiopia\'s tax and customs framework is interpreted, '
                        'administered, and enforcedâ€”an institutional perspective that complements her '
                        'subsequent work advising businesses and organizations.',
                        'Her broader experience across government and the private sector enables her to '
                        'approach regulatory matters from both institutional and commercial perspectives. She '
                        'brings particular expertise in taxation, customs, regulatory compliance, dispute '
                        'management, and engagement with government institutions.',
                        'At Dinq, Kalkidan supports international businesses, investors, and institutions '
                        'navigating the tax, customs, and regulatory dimensions of entering and operating in '
                        'Ethiopia. She contributes particularly to market-entry and investment mandates where '
                        'understanding regulatory requirements, institutional processes, and potential '
                        'compliance risks is critical to successful execution.',
                    ]),
                    'focus': '\n'.join([
                        'Tax & Customs',
                        'Regulatory Advisory',
                        'Tax Disputes',
                        'Investment & Market Entry',
                        'Government & Institutional Engagement',
                    ]),
                },
            ],
            'order': 30,
        },

        # Our Network ---------------------------------------------------------
        {
            'key': 'network.eyebrow',
            'kind': 'text',
            'label': 'Our Network â€” eyebrow',
            'value': 'Our Network',
            'order': 40,
        },
        {
            'key': 'network.heading',
            'kind': 'text',
            'label': 'Our Network â€” heading',
            'value': 'Coordinated expertise, through one relationship.',
            'order': 41,
        },
        {
            'key': 'network.paragraphs',
            'kind': 'list',
            'label': 'Our Network â€” paragraphs',
            'data': [
                'No single discipline can address every aspect of a complex investment or cross-border '
                'mandate. Dinq coordinates legal, financial, technical, sector, and operational expertise '
                'according to the needs of each engagement. This allows clients to work through a central '
                'advisory relationship while drawing on specialized support when required.',
            ],
            'order': 42,
        },
    ],

    # =======================================================================
    # /about/kairos-law-alliance
    # =======================================================================
    'kairos-law-alliance': [
        # Hero -----------------------------------------------------------------
        {
            'key': 'hero.eyebrow',
            'kind': 'text',
            'label': 'Hero â€” eyebrow',
            'value': 'About Dinq Advisory Group',
            'order': 0,
        },
        {
            'key': 'hero.title',
            'kind': 'text',
            'label': 'Hero â€” title',
            'value': 'Strategic Alliance with Kairos Law',
            'order': 1,
        },
        {
            'key': 'hero.image',
            'kind': 'image',
            'label': 'Hero â€” background image',
            'value': '/media/assets/images/hero-addis.jpg',
            'order': 2,
        },

        # Alliance ------------------------------------------------------------
        {
            'key': 'alliance.logo',
            'kind': 'image',
            'label': 'Kairos Alliance â€” logo',
            'value': '/media/KAIROS_Logo_White_transparent.png',
            'order': 10,
        },
        {
            'key': 'alliance.label',
            'kind': 'text',
            'label': 'Kairos Alliance â€” label',
            'value': 'Strategic Legal Partner',
            'order': 11,
        },
        {
            'key': 'alliance.eyebrow',
            'kind': 'text',
            'label': 'Kairos Alliance â€” eyebrow',
            'value': 'Strategic Alliance',
            'order': 12,
        },
        {
            'key': 'alliance.heading',
            'kind': 'text',
            'label': 'Kairos Alliance â€” heading',
            'value': 'An Integrated Client Experience',
            'order': 13,
        },
        {
            'key': 'alliance.paragraphs',
            'kind': 'list',
            'label': 'Kairos Alliance â€” paragraphs',
            'data': [
                'Cross-border business and investment mandates frequently involve both commercial decisions '
                'and regulated legal work. Through Dinq\'s strategic collaboration with Kairos Law, clients '
                'can receive coordinated advisory, implementation, and legal support without having to manage '
                'disconnected workstreams themselves.',
                'Dinq remains the advisory and execution lead. Kairos Law provides Ethiopian legal services '
                'where required and within its professional mandate. The two teams coordinate around the '
                'client\'s objectives, while maintaining the appropriate professional roles and responsibilities.',
            ],
            'order': 14,
        },
        {
            'key': 'alliance.benefitsHeading',
            'kind': 'text',
            'label': 'Kairos Alliance â€” benefits heading',
            'value': 'What This Means for Clients',
            'order': 15,
        },
        {
            'key': 'alliance.benefits',
            'kind': 'list',
            'label': 'Kairos Alliance â€” benefits',
            'data': [
                'A coordinated strategy across commercial and legal workstreams.',
                'Fewer disconnected handoffs between advisors.',
                'Clearer implementation sequencing and stakeholder coordination.',
                'Access to legal support when a mandate requires it.',
                'A single client-centred approach focused on practical execution.',
            ],
            'order': 16,
        },
    ],

    # =======================================================================
    # /contact
    # =======================================================================
    'contact': [
        # Hero -----------------------------------------------------------------
        {
            'key': 'hero.eyebrow',
            'kind': 'text',
            'label': 'Hero â€” eyebrow',
            'value': 'Get in Touch',
            'order': 0,
        },
        {
            'key': 'hero.title',
            'kind': 'text',
            'label': 'Hero â€” title',
            'value': 'Letâ€™s Discuss What Youâ€™re Building, Investing In, or Managing in Ethiopia.',
            'order': 1,
        },
        {
            'key': 'hero.intro',
            'kind': 'textarea',
            'label': 'Hero â€” intro',
            'value': (
                'Whether you are evaluating an investment, entering the Ethiopian market, managing property '
                'from abroad, or coordinating a complex institutional mandate, Dinq can help you define the '
                'next practical step.'
            ),
            'order': 2,
        },

        # Direct contact details -----------------------------------------------
        {
            'key': 'details.emailLabel',
            'kind': 'text',
            'label': 'Contact details â€” email label',
            'value': 'Email',
            'order': 10,
        },
        {
            'key': 'details.email',
            'kind': 'text',
            'label': 'Contact details â€” email address',
            'value': 'info@dinqadvisory.com',
            'order': 11,
        },
        {
            'key': 'details.phoneLabel',
            'kind': 'text',
            'label': 'Contact details â€” phone label',
            'value': 'Phone',
            'order': 12,
        },
        {
            'key': 'details.phone',
            'kind': 'text',
            'label': 'Contact details â€” phone number',
            'value': '416-899-7000',
            'order': 13,
        },
        {
            'key': 'details.addressLabel',
            'kind': 'text',
            'label': 'Contact details â€” address label',
            'value': 'Address',
            'order': 14,
        },
        {
            'key': 'details.addressLine1',
            'kind': 'text',
            'label': 'Contact details â€” address line 1',
            'value': '40 Wynford Drive, Suite 208,',
            'order': 15,
        },
        {
            'key': 'details.addressLine2',
            'kind': 'text',
            'label': 'Contact details â€” address line 2',
            'value': 'Toronto, ON, Canada M3C 1J5',
            'order': 16,
        },

        # Offices ----------------------------------------------------------------
        # With more than one office listed, each group is named so a reader can
        # tell which phone and address belong to which country.
        {
            'key': 'details.canadaLabel',
            'kind': 'text',
            'label': 'Contact details â€” Canada office name',
            'value': 'Canada',
            'order': 17,
        },
        {
            'key': 'details.ethiopiaLabel',
            'kind': 'text',
            'label': 'Contact details â€” Ethiopia office name',
            'value': 'Ethiopia',
            'order': 18,
        },
        {
            'key': 'details.ethiopiaPhone',
            'kind': 'text',
            'label': 'Contact details â€” Ethiopia phone number',
            'value': '+251 952 064 444',
            'order': 19,
        },
        {
            'key': 'details.ethiopiaAddress',
            'kind': 'text',
            'label': 'Contact details â€” Ethiopia address',
            'value': 'Addis Ababa, Ethiopia',
            'order': 20,
        },

        # Confirmation ---------------------------------------------------------
        {
            'key': 'success.title',
            'kind': 'text',
            'label': 'Confirmation â€” heading',
            'value': 'Request received.',
            'order': 30,
        },
        {
            'key': 'success.reference',
            'kind': 'text',
            'label': 'Confirmation â€” reference line',
            'value': 'Your reference is',
            'order': 31,
        },
        {
            'key': 'success.resetCta',
            'kind': 'text',
            'label': 'Confirmation â€” button',
            'value': 'Send another message',
            'order': 32,
        },
    ],
}
