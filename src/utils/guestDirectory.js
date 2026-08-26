// Shared helpers for matching a visitor against the public guest directory
// and resolving which events a household is invited to. Mirrors the logic
// used in PublicRSVP so the wedding website and RSVP flow behave identically.

export function fuzzyMatch(query, target) {
  if (!query || !target) return false;
  if (query.length < 3) return false; // too short to fuzzy match safely
  if (target.startsWith(query) || query.startsWith(target)) return true;
  const maxDist = query.length <= 4 ? 1 : 2;
  if (Math.abs(query.length - target.length) > maxDist) return false;
  let prev = Array.from({ length: target.length + 1 }, (_, i) => i);
  for (let i = 1; i <= query.length; i++) {
    const curr = [i];
    for (let j = 1; j <= target.length; j++) {
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + (query[i - 1] === target[j - 1] ? 0 : 1),
      );
    }
    prev = curr;
  }
  return prev[target.length] <= maxDist;
}

// Match a free-text query against the guest directory (name / family / phone).
export function matchGuests(query, allGuests) {
  const q = (query || '').toLowerCase().trim();
  if (!q) return [];
  const qDigits = q.replace(/\D/g, '');

  const matches = allGuests.filter((g) => {
    const full = `${g.firstName} ${g.lastName}`.toLowerCase();
    const phone = g.phoneLast4 || '';
    if (full.includes(q) || q.includes(full)) return true;
    if (g.familyName && g.familyName.toLowerCase().includes(q)) return true;
    if (qDigits.length >= 4 && phone.includes(qDigits)) return true;
    if (fuzzyMatch(q, (g.firstName || '').toLowerCase())) return true;
    if (fuzzyMatch(q, (g.lastName || '').toLowerCase())) return true;
    return false;
  });

  matches.sort((a, b) => {
    const aFull = `${a.firstName} ${a.lastName}`.toLowerCase();
    const bFull = `${b.firstName} ${b.lastName}`.toLowerCase();
    const aExact = aFull.includes(q) || q.includes(aFull) ? 0 : 1;
    const bExact = bFull.includes(q) || q.includes(bFull) ? 0 : 1;
    return aExact - bExact || aFull.localeCompare(bFull);
  });

  return matches;
}

// Group matched guests by family, attaching the full family roster.
export function groupByFamily(matches, allGuests) {
  const families = {};
  matches.forEach((g) => {
    if (!g.familyName) {
      families[`__solo_${g.id}`] = { familyName: null, members: [g] };
      return;
    }
    const key = g.familyName;
    if (!families[key]) {
      const members = allGuests
        .filter((ag) => ag.familyName === g.familyName)
        .sort((a, b) => (a.firstName || '').localeCompare(b.firstName || ''));
      families[key] = { familyName: g.familyName, members };
    }
  });
  return Object.values(families);
}

// Resolve the household roster for a selected guest (adults first).
export function getHousehold(guest, allGuests) {
  const family = guest.familyName
    ? allGuests.filter((g) => g.familyName === guest.familyName)
    : [guest];
  return family.slice().sort((a, b) => {
    const aKid = a.isChild ? 1 : 0;
    const bKid = b.isChild ? 1 : 0;
    return aKid !== bKid ? aKid - bKid : (a.firstName || '').localeCompare(b.firstName || '');
  });
}

// An event is visible to a household if it invites everyone, or if any
// household member is explicitly on its guest list.
export function isEventInvited(event, householdIds) {
  if (event.inviteAll) return true;
  const ids = event.guestIds || [];
  return householdIds.some((id) => ids.includes(id));
}

export function filterInvitedEvents(events, household) {
  const householdIds = (household || []).map((g) => g.id);
  return (events || []).filter((event) => isEventInvited(event, householdIds));
}

// A friendly label for the identified household.
export function householdLabel(household) {
  if (!household || household.length === 0) return '';
  const familyName = household.find((g) => g.familyName)?.familyName;
  if (familyName) return `The ${familyName} Family`;
  const g = household[0];
  return `${g.firstName || ''} ${g.lastName || ''}`.trim();
}
