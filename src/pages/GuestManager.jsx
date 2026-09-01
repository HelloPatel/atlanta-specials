import GuestList from '../components/guests/GuestList';
import { PageHeader } from '../components/ui';

export default function GuestManager() {
  return (
    <div>
      <PageHeader
        eyebrow="Your people"
        title="Guest List"
        subtitle="Manage guests, families, and invitations in one place."
      />
      <GuestList />
    </div>
  );
}
