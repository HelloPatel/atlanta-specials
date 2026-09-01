import WebsiteBuilder from '../components/website/WebsiteBuilder';
import { PageHeader } from '../components/ui';

export default function WeddingWebsite() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        eyebrow="Guest-facing"
        title="Wedding Website"
        subtitle="Design a beautiful guest-facing website with your story, event details, and RSVP access."
      />
      <WebsiteBuilder />
    </div>
  );
}
