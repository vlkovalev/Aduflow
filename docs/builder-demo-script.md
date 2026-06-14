# ADUflow Builder Demo Script

Use this script for a guided 20-30 minute builder presentation.

## Positioning

ADUflow is a pilot pre-construction operating system for ADU and prefab builders. It helps qualify homeowner leads before manual estimating by turning an address into a feasibility, pricing, proposal, lender, permit, and project-tracking workflow.

Do not describe it as permit approval, bank approval, or a finished public SaaS product.

## Demo Goal

Show one builder that ADUflow can reduce early lead qualification time and create a more credible homeowner package.

## Recommended Demo Path

1. Start at the homepage.
   - Say: "ADUflow starts with feasibility before design."
   - Point to the pilot boundaries section.

2. Open `/builder/login`.
   - Select the demo builder.
   - Say: "This pilot uses builder-scoped login. Production-grade auth is a next step before wide onboarding."

3. Open `/builder/setup`.
   - Show the setup checklist.
   - Confirm database, models, options, and credentials.
   - Open the Import tab and show the model/options CSV templates.
   - Say: "Your catalog and credentials drive every customer-facing output."

4. Open `/configurator`.
   - Enter a real or demo address.
   - Show the zoning source label.
   - Say: "This is a first-pass screen. Fallback data is labelled and still requires builder review."

5. Pick a model and options.
   - Show factory cost vs site cost.
   - Show lender draw schedule.
   - Say: "This is more useful than a form because it produces a project package."

6. Submit a test lead.
   - Use a demo email and phone number.
   - Show the homeowner disclaimer before submission.

7. Open the proposal.
   - Show feasibility, source, budget, design envelope, and next steps.

8. Open the lender package.
   - Show builder credentials, itemized budget, draw schedule, and signature blocks.

9. Return to `/builder`.
   - Change lead status to `won`.
   - Open the project tracker.

10. Show permit, milestones, and draw log.
    - Update one permit status.
    - Update one milestone.
    - Submit one draw evidence note.
    - Refresh if possible to show persistence.

## Questions To Ask Builders

1. Which part of this would save you the most time today?
2. Where would you distrust the output?
3. What fields must be added to the lender package?
4. What models/options would you want to import first?
5. Would this help qualify leads before a site visit?
6. What would make this worth paying for monthly?

## Objection Handling

| Objection | Response |
| --- | --- |
| "Zoning is too local." | Correct. ADUflow labels source quality and treats zoning as a first-pass screen. The long-term plan is provider data plus jurisdiction-specific validation. |
| "Banks will still inspect." | Correct. The current lender package is meant to make financing conversations cleaner, not replace lender approval. |
| "My pricing is more complex." | The pilot starts with model and option pricing; the next step is builder-specific regional multipliers, margin controls, and imports. |
| "I do not want competitors seeing my leads." | The app now scopes builder data for the pilot, but production auth must be added before broad multi-builder onboarding. |
| "Customers may think this is final." | The configurator and proposal include disclaimers that outputs are estimates and not permit/financing approval. |

## Close

Ask for one pilot commitment:

> "Give us your top 2-3 ADU models, option pricing, and one real homeowner lead. We will run the lead through ADUflow and compare it against your current intake process."

## Success Criteria

The presentation succeeds if the builder says at least one of these:

- "This would save intake time."
- "This would make financing conversations easier."
- "This would help my sales team qualify leads."
- "I want to test it with one real lead."
