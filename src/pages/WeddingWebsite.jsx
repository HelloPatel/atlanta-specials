import WebsiteBuilder from '../components/website/WebsiteBuilder';

export default function WeddingWebsite() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="mb-4 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Wedding Website</h1>
        <p className="mt-1 text-xs sm:text-sm text-gray-500">
          Design a beautiful guest-facing website with your story, event details, and RSVP access.
        </p>
      </div>
      <WebsiteBuilder />
    </div>
  );
}
