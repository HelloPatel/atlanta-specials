import { useState } from 'react';
import { Heart, Search, Users, ChevronRight, User } from 'lucide-react';
import { matchGuests, groupByFamily, getHousehold } from '../../utils/guestDirectory';

// Mandatory name-entry gate for the public wedding website. A visitor tells us
// who they are; we match them against the public guest directory and hand the
// resolved household back so the site can show only their invited events.
export default function GuestGate({ coupleName, guests, onIdentify, onGeneral }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);

  const runSearch = (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setResults(matchGuests(query, guests));
    setSearched(true);
  };

  const families = groupByFamily(results, guests);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-wine-50 via-white to-amber-50 px-4 py-10">
      <div className="w-full max-w-lg rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur sm:p-9">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-wine-100 text-wine-700">
            <Heart size={24} />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-wine-600">You&apos;re invited</p>
          <h1 className="mt-2 text-2xl font-semibold text-gray-900">{coupleName}</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-gray-500">
            Please enter your name so we can show you the events you&apos;re invited to.
          </p>
        </div>

        <form onSubmit={runSearch} className="mt-7">
          <div className="relative">
            <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSearched(false); }}
              placeholder="Your first or last name"
              className="w-full rounded-full border border-gray-200 bg-white py-3.5 pl-11 pr-4 text-sm text-gray-900 shadow-sm focus:border-wine-500 focus:outline-none focus:ring-2 focus:ring-wine-200"
            />
          </div>
          <button
            type="submit"
            disabled={!query.trim()}
            className="mt-3 w-full rounded-full bg-wine-700 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:bg-wine-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Find my invitation
          </button>
        </form>

        {searched && families.length > 0 && (
          <div className="mt-6 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
              Select your household
            </p>
            {families.map(({ familyName, members }) => (
              <button
                key={familyName || members[0].id}
                onClick={() => onIdentify(getHousehold(members[0], guests))}
                className="group flex w-full items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 text-left transition hover:border-wine-300 hover:shadow-md"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-wine-50 text-wine-700">
                  {members.length > 1 ? <Users size={20} /> : <User size={20} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {familyName ? `The ${familyName} Family` : `${members[0].firstName} ${members[0].lastName}`}
                  </p>
                  <p className="truncate text-xs text-gray-500">
                    {members.map((m) => m.firstName).join(', ')}
                  </p>
                </div>
                <ChevronRight size={18} className="shrink-0 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-wine-500" />
              </button>
            ))}
          </div>
        )}

        {searched && families.length === 0 && (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-center">
            <p className="text-sm font-medium text-amber-900">We couldn&apos;t find that name</p>
            <p className="mt-1 text-xs leading-6 text-amber-700">
              Try your full name or a different spelling. Still stuck? Reach out to the couple for help.
            </p>
            {onGeneral && (
              <button
                onClick={onGeneral}
                className="mt-3 text-xs font-semibold text-wine-700 underline underline-offset-2 hover:text-wine-800"
              >
                View the general schedule instead
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
