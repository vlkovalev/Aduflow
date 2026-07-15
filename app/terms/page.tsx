import type { Metadata } from "next";
import Link from "next/link";
import { TopNav } from "../components/TopNav";

export const metadata: Metadata = { title: "Terms of Service | ADUflow", alternates: { canonical: "/terms" } };

export default function TermsPage() {
  return (
    <main><TopNav /><section className="band"><div className="sectionHeader" style={{ maxWidth: 820 }}>
      <p className="eyebrow">Effective July 15, 2026</p><h1>Terms of Service</h1>
      <p>These terms govern use of ADUflow. By creating an account or submitting a homeowner request, you agree to them.</p>
      <h2>Planning tool only</h2><p>ADUflow provides preliminary feasibility, pricing, proposal, permit-checklist, lender-package, and project-workflow tools. Results are estimates and are not a final quote, professional design, legal advice, financing approval, permit approval, or guarantee that a project can be built.</p>
      <h2>Builder responsibility</h2><p>Builders are responsible for their catalog, pricing, credentials, licenses, insurance, communications, contracts, regulatory compliance, and all representations made to homeowners. Users must independently verify zoning, site conditions, utilities, engineering, permitting, taxes, and construction costs.</p>
      <h2>Accounts and acceptable use</h2><p>You must provide accurate information, protect account credentials, and promptly report suspected misuse. You may not probe, disrupt, scrape, reverse engineer, misuse another tenant&apos;s information, submit unlawful content, or use the service to deceive or harm others.</p>
      <h2>Billing</h2><p>Paid plans are month-to-month and renew until canceled through the billing portal. Base fees and included usage are shown on the pricing and checkout pages. Qualified-proposal overages are billed according to the selected plan. Except where law requires otherwise, charges already incurred are non-refundable. Canceling stops future renewals but does not erase amounts already due.</p>
      <h2>Service availability</h2><p>We may change, suspend, or discontinue features and may restrict access to protect users or the service. Pilot features may change and are provided without a long-term availability commitment.</p>
      <h2>Warranty and liability</h2><p>The service is provided on an &ldquo;as available&rdquo; basis. To the maximum extent permitted by law, ADUflow disclaims implied warranties and is not liable for indirect, special, consequential, or lost-profit damages. ADUflow&apos;s aggregate liability for a paid account is limited to fees paid for the service during the previous three months.</p>
      <h2>Contact</h2><p>Questions may be sent to <a href="mailto:support@aduflow.ca">support@aduflow.ca</a>. Our handling of personal information is described in the <Link href="/privacy">Privacy Policy</Link>.</p>
    </div></section></main>
  );
}
