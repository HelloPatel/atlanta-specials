import BudgetDashboard from '../components/budget/BudgetDashboard';
import CollaboratorsPanel from '../components/collaboration/CollaboratorsPanel';

export default function BudgetManager() {
  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1 min-w-0">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Budget &amp; Planner</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Track estimates, vendor quotes, deposits, and balances across every part of your celebration
          </p>
        </div>
        <BudgetDashboard />
      </div>
      <div className="w-full lg:w-72 xl:w-80 flex-shrink-0">
        <CollaboratorsPanel />
      </div>
    </div>
  );
}
