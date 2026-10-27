from app.services.image_engine.composer import MarketingImageComposer

test_cases = [
    {
        'title': 'Eliminate 15+ Hours of Repetitive Manual Tasks Every Week',
        'topic': 'Repetitive Tasks & Time Saved',
        'description': 'Automate busywork, document routing, and daily admin tasks so your team can focus on high-value strategy.',
    },
    {
        'title': 'Smart Automated Invoicing: Send, Track & Reconcile Bills via WhatsApp',
        'topic': 'Invoicing & Billing Automation',
        'description': 'Create, send, and track tax-compliant invoices automatically with instant WhatsApp reminders and bank reconciliation.',
    },
    {
        'title': 'Intelligent Calendar Scheduling: Zero Conflicts & 24/7 Booking',
        'topic': 'Meeting & Calendar Automation',
        'description': 'Let clients book appointments 24/7 across multiple time zones with zero calendar clashes and automated SMS reminders.',
    },
    {
        'title': 'Automated Data Entry & Extraction: Raw Documents to CRM Records',
        'topic': 'OCR & Data Processing',
        'description': 'Extract structured data from scanned PDFs, receipts, and spreadsheets with 99.9% accuracy directly into your database.',
    },
    {
        'title': 'Turn Cold Leads Into Closed Deals: 60-Second AI Follow-ups',
        'topic': 'Sales Pipeline & Lead Growth',
        'description': 'Engage new inbound prospects in under 60 seconds, score deal velocity, and sync notes directly into your CRM.',
    },
    {
        'title': 'Scale to 50,000 Customer Calls Every Morning with AI Voice Agents',
        'topic': 'Customer Calling & Voice AI',
        'description': 'Automate inbound reception, outbound lead qualification, and payment reminders with natural human-sounding voice agents.',
    },
    {
        'title': 'Put Your Social Media on Autopilot: 30 Days of Content in Minutes',
        'topic': 'Social Media Automation',
        'description': 'Create, design, and schedule 30 days of high-converting branded posts across LinkedIn, Twitter, and Instagram.',
    },
    {
        'title': '24/7 Tier-1 Customer Support Desk: Sub-Second Incident Resolution',
        'topic': 'Customer Support & Helpdesk',
        'description': 'Resolve customer tickets in seconds with 24/7 autonomous support agents and smart human escalation.',
    },
    {
        'title': 'Real-Time Executive Intelligence: Automated KPI Dashboards & Reports',
        'topic': 'Business Intelligence & Analytics',
        'description': 'Automate weekly KPI reporting, revenue forecasts, and cross-department analytics into real-time visual dashboards.',
    }
]

composer = MarketingImageComposer()
for tc in test_cases:
    ctx = composer.get_topic_context(tc)
    print("=" * 60)
    print(f"TITLE: {tc['title'][:45]}...")
    print(f"  Theme:        {ctx['theme']}")
    print(f"  Agent Name:   {ctx['agent_name']}")
    print(f"  Banner Topic: {ctx['banner_topic']}")
    print(f"  Callout:      {ctx['callout'].replace(chr(10), ' ')}")
    print(f"  Benefits:     {[b['title'] for b in ctx['benefits']]}")
