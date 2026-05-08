# User Interviews — AI Spend Audit

Three interviews were conducted during the build week to validate the problem and understand how startups and students actually manage AI tool subscriptions. Names and companies are simplified for privacy, but the insights are based on real conversations.

---

## Interview 1: Abhilash Sir — Assistant Professor

**Background:** Abhilash Sir teaches Computer Science and regularly works with students using AI tools like ChatGPT, GitHub Copilot, and Cursor for projects and coding practice. He also guides mini-project and hackathon teams.

**Current AI tool spend:** Mostly institution/student-based usage with occasional personal subscriptions.

### Key Quotes

> "Most students keep buying tools because everyone else is using them. Half the time they don’t even know whether they really need the paid version."

> "If a tool can clearly explain where money is being wasted, students and small teams will actually use it."

> "A good audit tool should not force recommendations. Sometimes the current setup itself is fine."

### Surprising Findings

1. **Students copy trends blindly** — Many students buy premium AI tools because of hype, not actual usage. This validated the need for simple usage-based recommendations.

2. **Transparency matters** — Abhilash Sir emphasized that people trust tools that explain *why* a recommendation is made instead of just pushing cheaper plans.

3. **Most people never recheck subscriptions** — Once subscribed, users rarely revisit pricing or usage patterns even when plans change.

### Changes Made Based on This Interview

- Added clear reasoning for every recommendation
- Improved the “already optimized” state using the `isOptimal` flag
- Focused on simple explanations instead of technical finance language

---

## Interview 2: Rohit — Final Year Engineering Student

**Background:** Rohit is a final-year engineering student working on placements, projects, and competitive coding. He uses ChatGPT Plus and Cursor Pro regularly.

**Current AI tool spend:** ~₹3,000/month across multiple subscriptions.

### Key Quotes

> "I subscribed to both ChatGPT and Claude because YouTube videos kept recommending different tools for different things."

> "Sometimes I feel like I’m paying for features I barely use."

> "If I could see all my AI expenses in one place with suggestions, that would actually help."

### Surprising Findings

1. **Tool overlap is common** — Rohit was paying for multiple tools that solved almost the same problem.

2. **Students care about monthly savings** — Even saving ₹500–₹1000/month mattered because of limited budgets.

3. **People want simple dashboards** — Users preferred clean summaries instead of complex analytics.

### Changes Made Based on This Interview

- Added alternative tool recommendations
- Made monthly savings highly visible
- Simplified recommendation wording and UI messaging

---

## Interview 3: Sneha — Freelance Developer

**Background:** Sneha is a freelance web developer handling multiple client projects. She uses Cursor Pro, ChatGPT Plus, and GitHub Copilot depending on the project requirements.

**Current AI tool spend:** ~₹5,000/month.

### Key Quotes

> "The problem isn’t just the money — switching tools affects workflow and productivity."

> "Sometimes I keep subscriptions active just because I might need them later."

> "An alert system for price changes or unused subscriptions would be useful."

### Surprising Findings

1. **Workflow comfort matters** — Users hesitate to remove tools because they’re used to their workflow.

2. **Unused subscriptions stay active for months** — Many users postpone cancellations because the monthly amount feels small.

3. **People want ongoing tracking** — A one-time audit is useful, but users also want notifications and monitoring.

### Changes Made Based on This Interview

- Added softer recommendation language like:
  *“unless you heavily rely on specific features”*

- Planned a pricing alert feature for future versions
- Added support for highlighting low-usage subscriptions

---

# Synthesis

| Insight                          | Abhilash Sir | Rohit | Sneha | Product Change                     |
| -------------------------------- | ------------ | ------ | ------ | ---------------------------------- |
| Users oversubscribe              | Yes          | Yes    | Yes    | Alternative tool suggestions       |
| Trust requires honest feedback   | Critical     | Medium | Medium | `isOptimal` badge                  |
| Workflow disruption matters      | Medium       | Medium | High   | Softer recommendation wording      |
| Users ignore unused subscriptions| Yes          | Yes    | Yes    | Subscription usage checks          |
| Monthly savings matter           | Medium       | High   | High   | Prominent savings display          |
| Need ongoing monitoring          | Medium       | Medium | High   | Planned pricing alert feature      |
| Simplicity is important          | High         | High   | Medium | Cleaner reports and recommendations|

The biggest insight from all three interviews was:

**Users don’t want aggressive selling — they want honest, understandable recommendations backed by real reasoning.**

The audit engine was designed around that idea by:
- showing clear calculations,
- explaining recommendations,
- avoiding unnecessary changes,
- and acknowledging when a user’s current setup is already good.