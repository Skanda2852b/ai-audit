# LLM Prompts — AI Spend Audit

This document records all prompts used in the AI Spend Audit system, including the system prompt for summary generation, the fallback template, and other AI interactions. Keeping a prompt log ensures reproducibility, enables iteration, and documents the design decisions behind each prompt.

---

## 1. Audit Summary Generation — System Prompt

**Used in:** `src/lib/llm.ts` → `generateSummary()`
**Model:** z-ai-web-dev-sdk chat completions
**Temperature:** 0.3
**Max tokens:** 300

### System Message

```
You are a concise financial advisor for AI tool spending. Give specific, actionable advice with dollar amounts. No fluff, no markdown, just clear recommendations.
```

**Design decisions:**
- "Concise financial advisor" sets the persona — authoritative but brief
- "Specific, actionable advice with dollar amounts" ensures the output includes concrete numbers, not vague suggestions
- "No fluff, no markdown" prevents formatting that looks bad in the UI card and email template
- "Just clear recommendations" eliminates hedging language and filler

### User Message Template

```
You are a concise AI spending advisor for startups. Based on the audit data below, write a 3-4 sentence summary with specific dollar amounts. Be direct and actionable. Do not use markdown formatting.

Current monthly spend: $${auditData.totalMonthlyCurrent}
Optimized monthly spend: $${auditData.totalMonthlyOptimized}
Monthly savings: $${auditData.totalMonthlySavings}
Annual savings: $${auditData.totalAnnualSavings}
${auditData.isHighSavings ? 'This is a HIGH savings opportunity.' : ''}
${auditData.isOptimal ? 'The stack is already well-optimized.' : ''}

Recommendations:
${auditData.recommendations.map((r) => `- ${r.toolName} (${r.currentPlan}): ${r.recommendedAction} — Save $${r.monthlySavings}/mo. ${r.reason}`).join('\n')}
```

**Design decisions:**
- "3-4 sentence summary" constrains length to fit the UI card
- "Specific dollar amounts" is repeated for emphasis — the LLM sometimes omits numbers without this
- The conditional flags (`isHighSavings`, `isOptimal`) give the LLM context to adjust tone
- Each recommendation is formatted as a single line with tool name, action, savings, and reason — this is already structured data, so the LLM's job is synthesis, not generation
- "Do not use markdown formatting" appears in both system and user messages because a single instruction wasn't sufficient in testing

### Iteration History

| Version | Problem                                    | Fix                                                       |
| ------- | ------------------------------------------ | --------------------------------------------------------- |
| v1      | Output was 5+ paragraphs, too long         | Added "3-4 sentence" constraint                           |
| v2      | Used `**bold**` and `# headers` in output  | Added "no markdown" instruction                           |
| v3      | Sometimes omitted dollar amounts           | Added "with specific dollar amounts" to both messages     |
| v4      | Occasionally gave hedging advice           | Added "Be direct and actionable"                          |
| **v5**  | **Current version — produces clean output** | **No changes needed**                                     |

---

## 2. Fallback Summary Template

**Used in:** `src/lib/llm.ts` → `getFallbackSummary()`
**Trigger:** LLM API call fails (timeout, rate limit, network error)

### Template Logic

```
If auditData.isOptimal:
  "Your AI stack at $${totalMonthlyCurrent}/month is already well-optimized.
   You're spending efficiently across your tools. We'll notify you when new
   savings opportunities appear as pricing changes."

Else if auditData.isHighSavings:
  "Your AI stack currently costs $${totalMonthlyCurrent}/month. By optimizing
   plans and tool choices, you could save $${savings}/month. The biggest
   opportunity: ${topRecommendation.recommendedAction} for ${topRecommendation.toolName},
   saving $${topRecommendation.monthlySavings}/month. With $${annual}/year in
   potential savings, this is a high-impact optimization — consider booking a
   free consultation to explore enterprise discount programs."

Else:
  "Your AI stack currently costs $${totalMonthlyCurrent}/month. By optimizing
   plans and tool choices, you could save $${savings}/month. The biggest
   opportunity: ${topRecommendation.recommendedAction} for ${topRecommendation.toolName},
   saving $${topRecommendation.monthlySavings}/month. That's $${annual}/year
   back in your budget."
```

**Design decisions:**
- Three variants ensure the fallback message matches the audit outcome
- The high-savings variant includes the consultation CTA inline (matching the email template)
- The optimal variant plants the seed for the "pricing alerts" feature
- All variants include specific dollar amounts, maintaining consistency with the LLM-generated version
- The `topRecommendation` is found by `auditData.recommendations.find((r) => r.monthlySavings > 0)`

---

## 3. Share Text Template

**Used in:** `src/components/ShareButtons.tsx` → Twitter share button

### Template

```
I just found $${savings.toFixed(0)}/month in AI tool savings with AI Spend Audit! Check yours:
```

**Design decisions:**
- First-person voice is more shareable than third-person
- The specific savings amount is the hook — it makes people curious
- "Check yours" is a direct CTA that implies the tool is easy to use
- No hashtags or emojis — keeps it professional and genuine

---

## 4. Email Subject Line

**Used in:** `src/lib/email.ts` → `captureLeadAndNotify()`

### Template

```
Your AI Spend Audit Report
```

**Design decisions:**
- Simple and descriptive — no clickbait
- "Your" makes it personal
- "Report" implies something substantial and worth opening
- Tested alternatives: "Save $X/month on AI tools" (too salesy), "AI Spend Audit Results" (too generic), "Your AI tool savings" (ambiguous)

---

## 5. Email Body Template

**Used in:** `src/lib/email.ts` → `captureLeadAndNotify()`

### HTML Template

```html
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #1a1a1a;">Your AI Spend Audit Report</h1>
  <p>Thanks for using AI Spend Audit! Here's your personalized report:</p>
  <a href="${shareableUrl}"
     style="display: inline-block; padding: 12px 24px;
            background: #10b981; color: white; border-radius: 8px;
            text-decoration: none; font-weight: 600;">
    View Your Report
  </a>
  ${monthlySavings > 500 ?
    '<p style="margin-top: 16px; padding: 12px; background: #fef3c7;
      border-radius: 8px;">💡 With over $500/month in potential savings,
      a specialist could help you access enterprise discount programs.
      Reply to this email to schedule a free consultation.</p>'
    : ''}
  <p style="margin-top: 24px; color: #6b7280; font-size: 14px;">
    No contract changes needed — most optimizations take 5 minutes
    in your billing dashboard.
  </p>
</div>
```

**Design decisions:**
- Inline styles only (Gmail strips `<style>` tags)
- The CTA button uses emerald-600 (#10b981) to match the brand
- The high-savings consultation CTA uses an amber background (#fef3c7) to stand out without being alarming
- The "5 minutes" reassurance reduces friction for taking action
- The email is intentionally short — the full report is on the shareable URL, not in the email itself (which drives traffic back to the site)

---

## Prompt Maintenance Guidelines

1. **Never edit a prompt without updating the iteration history** — every change should be documented with the problem it solved
2. **Test prompt changes with 5+ audit scenarios** — optimal stack, high savings, single tool, multi-tool, zero savings
3. **Keep the fallback template in sync** — if the LLM prompt tone changes, update the fallback to match
4. **Log LLM failures** — if the fallback fires more than 5% of the time, investigate the API integration
5. **Version the prompts** — when making significant changes, keep the old version commented in the code for rollback
