import EventList from '../components/events/EventList';
import { PageHeader } from '../components/ui';

export default function EventManager() {
  return (
    <div>
      <PageHeader
        eyebrow="Celebrations"
        title="Events"
        subtitle="Plan every celebration, from mehndi and sangeet to the ceremony and reception."
      />
      <EventList />
    </div>
  );
}
