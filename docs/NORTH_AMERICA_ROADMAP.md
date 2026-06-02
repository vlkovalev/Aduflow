# ADUflow North America Roadmap

## Strategic Position

ADUflow adapts the strongest part of PZZL for North America, but changes the order of operations.

PZZL begins with configurable home products. ADUflow should begin with feasibility, because North American residential construction is blocked first by zoning, servicing, permitting, HOA review, and lender trust.

## 1. Pre-Construction AI Engine

The first product layer is zoning and feasibility.

Inputs:
- Address or parcel profile
- Municipality or province/state
- Lot condition
- Desired building type
- Servicing assumptions
- HOA or design review flag

Outputs:
- Likely maximum ADU size
- Height and story guidance
- Setback targets
- Permit path
- Review risk
- Builder-ready next steps

MVP implementation:
- Start with guided parcel scenarios
- Replace scenarios with GIS and municipal bylaw integrations later

## 2. Prefab and Modular Cost Model

North American ADUflow should separate cost into two buckets:

- Factory cost: module, panel, shell, finish package, manufacturer margin
- Site cost: foundation, utility tie-ins, transport, crane, permits, inspections, local labor

This helps homeowners understand the budget and helps builders quote repeatable scopes.

## 3. Permit and HOA Assistant

The assistant should prepare:

- Municipal permit checklist
- Drawing package requirements
- HOA architectural review package
- Revision tracker
- Builder/client responsibility matrix

This is a safer early product than claiming automated permit approval.

## 4. Digital Draw Verification

Long-term, ADUflow can become a lender-trust layer.

Milestones:
- Deposit and permit package
- Foundation ready
- Factory completion
- Set and weather-tight
- Final inspection

Evidence:
- Geotagged photos
- Time-stamped site updates
- Inspection documents
- QA/QC checklists
- Contractor signoff

Important constraint:
AI can organize and pre-check evidence, but lender release decisions should remain with the lender, inspector, or authorized professional.

## 5. Future Product Agents

Do not start with fully autonomous construction agents. Start with durable project records, then add focused assistants around specific workflows.

Future assistants:
- Feasibility Agent: reviews parcel inputs, jurisdiction rules, setbacks, height, servicing risk, and likely ADU envelope
- Proposal Agent: turns a configured project into a homeowner-facing proposal, line-item summary, and builder review packet
- Permit Package Agent: prepares municipal and HOA checklists, document requirements, and revision tasks
- Prefab Matching Agent: compares eligible manufacturer models against parcel constraints, budget, transport zone, and site conditions
- Draw Evidence Agent: organizes milestone photos, inspection documents, contractor signoffs, and lender-ready evidence packets

Guardrail:
These agents should recommend, prepare, and flag issues. They should not approve permits, certify inspections, or authorize lender releases.

## Verdict

The best version of ADUflow is not a generic home configurator. It is a feasibility-to-financing operating system for ADUs, garden suites, garage conversions, and small modular buildings.
