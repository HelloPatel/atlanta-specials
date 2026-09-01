import BudgetDashboard from '../components/budget/BudgetDashboard';
import CollaboratorsPanel from '../components/collaboration/CollaboratorsPanel';
import { PageHeader } from '../components/ui';

export default function BudgetManager() {
  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1 min-w-0">
        <PageHeader
          eyebrow="Money"
          title="Budget & Planner"
          subtitle="Track estimates, vendor quotes, deposits, and balances across every part of your celebration."
        />
        <BudgetDashboard />
      </div>
      <div className="w-full lg:w-72 xl:w-80 flex-shrink-0">
        <CollaboratorsPanel />
      </div>
    </div>
  );
}
