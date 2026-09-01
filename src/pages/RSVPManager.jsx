import RSVPAdmin from '../components/rsvp/RSVPAdmin';
import CollaboratorsPanel from '../components/collaboration/CollaboratorsPanel';
import { useWedding } from '../contexts/WeddingContext';
import { PageHeader } from '../components/ui';

export default function RSVPManager() {
  const { isViewer } = useWedding();

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1 min-w-0">
        <PageHeader
          eyebrow="Responses"
          title="RSVP"
          subtitle={
            <>
              Track responses and manage guest RSVPs per event.
              {isViewer && <span className="ml-2 font-medium text-amber-600">(Read-only)</span>}
            </>
          }
        />
        <RSVPAdmin />
      </div>
      <div className="w-full lg:w-72 xl:w-80 flex-shrink-0">
        <CollaboratorsPanel />
      </div>
    </div>
  );
}
