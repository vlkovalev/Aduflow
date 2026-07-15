import type { Metadata } from "next";
import Link from "next/link";
import { TopNav } from "../components/TopNav";

export const metadata: Metadata = { title: "Privacy Policy | ADUflow", alternates: { canonical: "/privacy" } };

export default function PrivacyPage() {
  return (
    <main><TopNav /><section className="band"><div className="sectionHeader" style={{ maxWidth: 820 }}>
      <p className="eyebrow">Effective July 15, 2026</p><h1>Privacy Policy</h1>
      <p>ADUflow provides pre-construction software for ADU and modular builders. This policy explains how ADUflow and the builder identified in a configurator link handle information submitted through the service.</p>
      <h2>Information we collect</h2><p>We may collect your name, email, phone number, property address, configuration selections, feasibility inputs, proposal activity, builder account details, and technical information needed to secure and operate the service.</p>
      <h2>How information is used</h2><p>We use information to produce estimates and proposals, route inquiries to the selected builder, communicate about a project or account, operate billing, prevent abuse, improve the service, and meet legal obligations.</p>
      <h2>Who receives information</h2><p>Homeowner submissions are shared with the builder associated with the configurator. We also use service providers for hosting, databases, email, rate limiting, and billing. They process information only to provide those services. We do not sell homeowner leads to competing builders.</p>
      <h2>Retention and security</h2><p>We retain information only as long as needed for the purposes above, contractual requirements, dispute resolution, and applicable law. We use access controls, encrypted transport, signed sessions, tenant-scoped records, and audited service providers, but no online system is risk-free.</p>
      <h2>Your choices</h2><p>You may request access, correction, or deletion of your information, subject to legal and contractual retention requirements. You may also withdraw from non-essential communications.</p>
      <h2>Estimates and public records</h2><p>Zoning and feasibility results may use public, municipal, third-party, or builder-entered information. They are planning estimates, not permit, legal, lending, or construction approval.</p>
      <h2>Contact</h2><p>For privacy requests, contact the builder shown in your proposal or email <a href="mailto:privacy@aduflow.ca">privacy@aduflow.ca</a>. See also our <Link href="/terms">Terms of Service</Link>.</p>
    </div></section></main>
  );
}
