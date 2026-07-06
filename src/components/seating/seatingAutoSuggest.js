/**
 * Auto-suggest seating algorithm for Indian weddings.
 * Groups guests by family first, then fills tables respecting:
 * - Keep-together rules
 * - Keep-apart rules
 * - Family unity (prefer same table)
 * - Side balance (bride vs groom side per table is ok, but families stay together)
 * - Dietary grouping (optional: group veg together)
 */

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

/**
 * Group guests into clusters that should be seated together.
 * Priority: keep-together rules > family groups > individual guests.
 */
export function buildGuestClusters(guests, rules = []) {
  const clusters = [];
  const assigned = new Set();

  // 1. Keep-together rules form mandatory clusters
  const keepTogetherRules = rules.filter((r) => r.type === 'keep-together');
  for (const rule of keepTogetherRules) {
    const ruleGuestIds = new Set(rule.guestIds || []);
    // Also include family members if familyName is specified
    if (rule.familyName) {
      guests
        .filter((g) => normalizeText(g.familyName) === normalizeText(rule.familyName))
        .forEach((g) => ruleGuestIds.add(g.id));
    }
    const clusterGuests = guests.filter((g) => ruleGuestIds.has(g.id) && !assigned.has(g.id));
    if (clusterGuests.length > 0) {
      clusters.push({
        id: `rule-${rule.id}`,
        guests: clusterGuests,
        familyName: rule.familyName || null,
        reason: 'keep-together',
      });
      clusterGuests.forEach((g) => assigned.add(g.id));
    }
  }

  // 2. Group remaining guests by family
  const familyMap = new Map();
  for (const guest of guests) {
    if (assigned.has(guest.id)) continue;
    const family = normalizeText(guest.familyName) || `solo-${guest.id}`;
    if (!familyMap.has(family)) familyMap.set(family, []);
    familyMap.get(family).push(guest);
  }

  for (const [familyKey, members] of familyMap) {
    clusters.push({
      id: `family-${familyKey}`,
      guests: members,
      familyName: members[0]?.familyName || null,
      reason: 'family',
    });
    members.forEach((g) => assigned.add(g.id));
  }

  return clusters;
}

/**
 * Build a conflict map from keep-apart rules.
 * Returns a Map<guestId, Set<guestId>> of guests that should not be at the same table.
 */
export function buildConflictMap(rules = [], guests = []) {
  const conflicts = new Map();
  const keepApartRules = rules.filter((r) => r.type === 'keep-apart');

  for (const rule of keepApartRules) {
    const ruleGuestIds = [...(rule.guestIds || [])];
    if (rule.familyName) {
      guests
        .filter((g) => normalizeText(g.familyName) === normalizeText(rule.familyName))
        .forEach((g) => { if (!ruleGuestIds.includes(g.id)) ruleGuestIds.push(g.id); });
    }

    // For keep-apart: first group vs rest (same logic as evaluateSeatingRules)
    const familyGuests = rule.familyName
      ? guests.filter((g) => normalizeText(g.familyName) === normalizeText(rule.familyName))
      : [];
    const selectedGuests = (rule.guestIds || []).map((id) => guests.find((g) => g.id === id)).filter(Boolean);
    const leftGroup = familyGuests.length > 0 ? familyGuests : selectedGuests.slice(0, 1);
    const rightGroup = familyGuests.length > 0 ? selectedGuests : selectedGuests.slice(1);

    for (const left of leftGroup) {
      for (const right of rightGroup) {
        if (!conflicts.has(left.id)) conflicts.set(left.id, new Set());
        if (!conflicts.has(right.id)) conflicts.set(right.id, new Set());
        conflicts.get(left.id).add(right.id);
        conflicts.get(right.id).add(left.id);
      }
    }
  }

  return conflicts;
}

/**
 * Check if placing a cluster at a table would violate any keep-apart rules.
 */
function hasConflict(cluster, tableGuestIds, conflictMap) {
  for (const guest of cluster.guests) {
    const guestConflicts = conflictMap.get(guest.id);
    if (!guestConflicts) continue;
    for (const tableGuestId of tableGuestIds) {
      if (guestConflicts.has(tableGuestId)) return true;
    }
  }
  return false;
}

/**
 * Auto-suggest seating arrangement.
 * 
 * @param {Array} unassignedGuests - Guests not yet seated
 * @param {Array} tables - Table definitions with capacity and current assignedGuests
 * @param {Array} rules - Seating rules (keep-together, keep-apart, dietary-group)
 * @param {Object} options - { groupDietary: boolean, preferSide: boolean }
 * @returns {{ assignments: Map<tableId, guestId[]>, overflow: guest[] }}
 */
export function autoSuggestSeating(unassignedGuests, tables, rules = [], options = {}) {
  const { groupDietary = false } = options;

  // Build clusters from unassigned guests
  const clusters = buildGuestClusters(unassignedGuests, rules);
  const conflictMap = buildConflictMap(rules, unassignedGuests);

  // Sort clusters: largest first (better packing)
  clusters.sort((a, b) => b.guests.length - a.guests.length);

  // Build table state: remaining capacity
  const tableState = tables.map((t) => ({
    id: t.id,
    name: t.name,
    capacity: t.capacity || 10,
    currentGuests: [...(t.assignedGuests || [])],
    remaining: (t.capacity || 10) - (t.assignedGuests || []).length,
  }));

  // Sort tables by remaining capacity (largest first)
  tableState.sort((a, b) => b.remaining - a.remaining);

  const assignments = new Map();
  tableState.forEach((t) => assignments.set(t.id, []));
  const overflow = [];

  for (const cluster of clusters) {
    const clusterSize = cluster.guests.length;
    let placed = false;

    // Find best table: enough capacity, no conflicts, optionally match dietary
    const candidates = tableState
      .filter((t) => t.remaining >= clusterSize)
      .filter((t) => !hasConflict(cluster, t.currentGuests, conflictMap));

    if (groupDietary && candidates.length > 1) {
      // Prefer tables where existing guests share dietary preference
      const clusterDietary = getDominantDietary(cluster.guests);
      candidates.sort((a, b) => {
        const aMatch = getDietaryMatchScore(a.currentGuests, clusterDietary, unassignedGuests);
        const bMatch = getDietaryMatchScore(b.currentGuests, clusterDietary, unassignedGuests);
        return bMatch - aMatch;
      });
    }

    if (candidates.length > 0) {
      const table = candidates[0];
      const guestIds = cluster.guests.map((g) => g.id);
      assignments.get(table.id).push(...guestIds);
      table.currentGuests.push(...guestIds);
      table.remaining -= clusterSize;
      placed = true;
    }

    if (!placed) {
      // Try splitting the cluster across tables (only if not a keep-together rule)
      if (cluster.reason !== 'keep-together') {
        for (const guest of cluster.guests) {
          const guestConflicts = conflictMap.get(guest.id) || new Set();
          const seat = tableState.find(
            (t) => t.remaining > 0 && !t.currentGuests.some((id) => guestConflicts.has(id))
          );
          if (seat) {
            assignments.get(seat.id).push(guest.id);
            seat.currentGuests.push(guest.id);
            seat.remaining -= 1;
          } else {
            overflow.push(guest);
          }
        }
      } else {
        overflow.push(...cluster.guests);
      }
    }
  }

  return { assignments, overflow };
}

function getDominantDietary(guests) {
  const counts = { veg: 0, 'non-veg': 0 };
  for (const g of guests) {
    const d = classifyDietary(g.dietary);
    if (d === 'veg') counts.veg++;
    else if (d === 'non-veg') counts['non-veg']++;
  }
  return counts.veg >= counts['non-veg'] ? 'veg' : 'non-veg';
}

function getDietaryMatchScore(tableGuestIds, targetDietary, allGuests) {
  if (tableGuestIds.length === 0) return 0.5; // neutral empty table
  const guestsById = new Map(allGuests.map((g) => [g.id, g]));
  let matches = 0;
  for (const id of tableGuestIds) {
    const g = guestsById.get(id);
    if (g && classifyDietary(g.dietary) === targetDietary) matches++;
  }
  return matches / tableGuestIds.length;
}

function classifyDietary(dietary) {
  const value = normalizeText(dietary);
  if (['vegetarian', 'vegan', 'jain'].includes(value)) return 'veg';
  if (value === 'non-veg') return 'non-veg';
  return 'other';
}
