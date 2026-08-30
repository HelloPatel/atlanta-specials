import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { resolveWeddingId } from '../../services/weddingService';
import WebsiteThemeScope from '../website/WebsiteThemeScope';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Camera,
  ChevronDown,
  ChevronUp,
  Copy,
  GripVertical,
  MonitorPlay,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
  Square,
  Trash2,
  Undo2,
  Upload,
  Users,
} from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { COLLECTIONS } from '../../config/constants';
import { useWedding } from '../../contexts/WeddingContext';
import { Badge, Button, Card, Modal } from '../ui';
import { useToast } from '../ui/Toast';
import {
  addGroup,
  deleteGroup,
  getPhotoDisplayLink,
  getPhotoQueueLink,
  importGroups,
  markCompleted,
  parseGroupsCsv,
  parseMembers,
  reorderGroups,
  resetQueue,
  setCurrentGroup,
  startQueue,
  stopQueue,
  subscribeToGroups,
  updateGroup,
} from '../../services/photoGroupService';
import { subscribeToGuests } from '../../services/guestService';

function getWeddingLabel(wedding) {
  return wedding?.coupleName || [wedding?.coupleName1, wedding?.coupleName2].filter(Boolean).join(' & ') || 'Wedding Photos';
}

function useWeddingPublicData(weddingId) {
  const [wedding, setWedding] = useState(null);

  useEffect(() => {
    if (!weddingId) {
      setWedding(null);
      return undefined;
    }

    return onSnapshot(
      doc(db, COLLECTIONS.PUBLIC_WEDDINGS, weddingId),
      (snap) => {
        setWedding(snap.exists() ? { id: snap.id, ...snap.data() } : null);
      },
      (error) => {
        // The private weddings/{id} doc is owner-only; guests must read the
        // public projection. Log + null so the page never hangs.
        console.error('Failed to load public wedding for photo queue:', error);
        setWedding(null);
      }
    );
  }, [weddingId]);

  return wedding;
}

function usePhotoGroups(weddingId) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!weddingId) {
      setGroups([]);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    const unsubscribe = subscribeToGroups(weddingId, (nextGroups) => {
      setGroups(nextGroups);
      setLoading(false);
    });

    return unsubscribe;
  }, [weddingId]);

  return { groups, loading };
}

function getQueueState(groups) {
  const sortedGroups = [...groups].sort((a, b) => {
    const aDone = a.status === 'completed' ? 1 : 0;
    const bDone = b.status === 'completed' ? 1 : 0;
    if (aDone !== bDone) return aDone - bDone;
    return (a.order ?? 0) - (b.order ?? 0);
  });
  const currentGroup = sortedGroups.find((group) => group.status === 'current') || null;
  const pendingGroups = sortedGroups.filter((group) => group.status !== 'completed' && group.id !== currentGroup?.id);
  const completedGroups = sortedGroups.filter((group) => group.status === 'completed');

  return {
    sortedGroups,
    currentGroup,
    pendingGroups,
    completedGroups,
  };
}

function PhotoGroupFormModal({ group, open, onClose, onSubmit }) {
  const [name, setName] = useState(group?.name || '');
  const [membersText, setMembersText] = useState((group?.members || []).join(', '));
  const [formError, setFormError] = useState('');

  useEffect(() => {
    setName(group?.name || '');
    setMembersText((group?.members || []).join(', '));
    setFormError('');
  }, [group]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!name.trim()) {
      setFormError('Enter a name for this photo group.');
      return;
    }
    setFormError('');

    await onSubmit({
      name: name.trim(),
      members: parseMembers(membersText),
    });
  };

  return (
    <Modal open={open} onClose={onClose} title={group ? 'Edit photo group' : 'Add photo group'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="photo-group-name" className="mb-1 block text-sm font-medium text-gray-700">Group name</label>
          <input
            id="photo-group-name"
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Bride's cousins"
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-base shadow-sm focus:border-wine-600 focus:outline-none focus:ring-1 focus:ring-wine-600 sm:text-sm"
          />
        </div>
        {formError && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>}
        <div>
          <label htmlFor="photo-group-members" className="mb-1 block text-sm font-medium text-gray-700">Members</label>
          <textarea
            id="photo-group-members"
            value={membersText}
            onChange={(event) => setMembersText(event.target.value)}
            rows={4}
            placeholder="One per line or separated by commas"
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-base shadow-sm focus:border-wine-600 focus:outline-none focus:ring-1 focus:ring-wine-600 sm:text-sm"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit">{group ? 'Save changes' : 'Add group'}</Button>
        </div>
      </form>
    </Modal>
  );
}

function ImportCsvModal({ open, onClose, onImport }) {
  const [text, setText] = useState('');
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setText('');
      setFileName('');
      setError('');
      setSubmitting(false);
    }
  }, [open]);

  const parsedGroups = useMemo(() => parseGroupsCsv(text), [text]);

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError('');
    try {
      const contents = await file.text();
      setText(contents);
      setFileName(file.name);
    } catch (readError) {
      setError(`Could not read the file: ${readError.message}`);
    }
    event.target.value = '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (parsedGroups.length === 0) {
      setError('No groups found. Add at least one row with a group name.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await onImport(parsedGroups);
    } catch (importError) {
      setError(`Import failed: ${importError.message}`);
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Import groups from CSV">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-xl bg-wine-50/70 px-3 py-2 text-xs text-wine-800">
          <p className="font-medium">Format: one group per row.</p>
          <p className="mt-1">First column is the <strong>group name</strong>; every column after it is a <strong>member</strong>.</p>
          <p className="mt-1 font-mono text-[11px] text-wine-700">Bride&apos;s cousins, Aisha, Rohan, Priya</p>
          <p className="text-[11px] text-wine-700">A header row (name, member…) is optional and skipped.</p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Upload a CSV file</label>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-3 text-sm text-gray-600 hover:border-wine-400 hover:text-wine-700">
            <Upload size={16} />
            <span>{fileName || 'Choose a .csv file'}</span>
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
          </label>
        </div>

        <div>
          <label htmlFor="csv-paste" className="mb-1 block text-sm font-medium text-gray-700">Or paste CSV</label>
          <textarea
            id="csv-paste"
            value={text}
            onChange={(event) => { setText(event.target.value); setFileName(''); }}
            rows={6}
            placeholder={'Group name, Member 1, Member 2\nBride\u2019s cousins, Aisha, Rohan, Priya'}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-xs shadow-sm focus:border-wine-600 focus:outline-none focus:ring-1 focus:ring-wine-600"
          />
        </div>

        {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        {parsedGroups.length > 0 && (
          <div className="rounded-xl border border-wine-100 bg-white p-3">
            <p className="text-sm font-medium text-gray-900">
              {parsedGroups.length} group{parsedGroups.length === 1 ? '' : 's'} ready to import
            </p>
            <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs text-gray-600">
              {parsedGroups.slice(0, 25).map((group, index) => (
                <li key={`${group.name}-${index}`} className="truncate">
                  <span className="font-medium text-gray-800">{group.name}</span>
                  {group.members.length > 0 && <span className="text-gray-500"> — {group.members.join(', ')}</span>}
                </li>
              ))}
              {parsedGroups.length > 25 && (
                <li className="text-gray-400">…and {parsedGroups.length - 25} more</li>
              )}
            </ul>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={submitting || parsedGroups.length === 0}>
            {submitting ? 'Importing…' : `Import ${parsedGroups.length || ''} group${parsedGroups.length === 1 ? '' : 's'}`.trim()}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function guestFullName(guest) {
  return [guest.firstName, guest.lastName].filter(Boolean).join(' ').trim();
}

const GUEST_GROUP_DIMENSIONS = [
  { id: 'family', label: 'Family' },
  { id: 'table', label: 'Seating table' },
  { id: 'side', label: 'Side (bride / groom)' },
  { id: 'relation', label: 'Relation' },
  { id: 'tags', label: 'Tag' },
];

// Turn the guest list into { name, members } photo groups by a chosen dimension.
function buildGroupsFromGuests(guests, dimension) {
  const buckets = new Map();

  const push = (key, label, guest) => {
    if (!key) return;
    if (!buckets.has(key)) buckets.set(key, { label, members: [] });
    const name = guestFullName(guest);
    if (name) buckets.get(key).members.push(name);
    if (guest.plusOne && guest.plusOneName) {
      buckets.get(key).members.push(`${guest.plusOneName.trim()} (+1)`);
    }
  };

  guests.forEach((guest) => {
    switch (dimension) {
      case 'family': {
        const label = (guest.familyName || '').trim();
        push(label ? `fam:${label.toLowerCase()}` : '', label, guest);
        break;
      }
      case 'table': {
        const table = guest.tableNumber;
        if (table === null || table === undefined || `${table}`.trim() === '') break;
        push(`tbl:${table}`, `Table ${table}`, guest);
        break;
      }
      case 'side': {
        const side = (guest.side || '').trim().toLowerCase();
        if (!side) break;
        const label = side === 'groom' ? "Groom's side" : side === 'bride' ? "Bride's side" : side;
        push(`side:${side}`, label, guest);
        break;
      }
      case 'relation': {
        const label = (guest.relation || '').trim();
        push(label ? `rel:${label.toLowerCase()}` : '', label, guest);
        break;
      }
      case 'tags': {
        (guest.tags || []).forEach((tag) => {
          const label = `${tag}`.trim();
          push(label ? `tag:${label.toLowerCase()}` : '', label, guest);
        });
        break;
      }
      default:
        break;
    }
  });

  return Array.from(buckets.values())
    .filter((bucket) => bucket.label && bucket.members.length > 0)
    .map((bucket) => ({ name: bucket.label, members: bucket.members }))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
}

function BuildFromGuestsModal({ open, weddingId, onClose, onImport }) {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dimension, setDimension] = useState('family');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !weddingId) return undefined;
    setLoading(true);
    setError('');
    const unsubscribe = subscribeToGuests(weddingId, (list) => {
      setGuests(list);
      setLoading(false);
    });
    return unsubscribe;
  }, [open, weddingId]);

  useEffect(() => {
    if (!open) {
      setDimension('family');
      setError('');
      setSubmitting(false);
    }
  }, [open]);

  const previewGroups = useMemo(() => buildGroupsFromGuests(guests, dimension), [guests, dimension]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (previewGroups.length === 0) {
      setError('No groups could be built. Try a different grouping, or add the data to your guests first.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await onImport(previewGroups);
    } catch (importError) {
      setError(`Could not create groups: ${importError.message}`);
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Build groups from guests">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-500">
          Turn your existing guest list into photo groups automatically. Pick how you want to group them.
        </p>

        <div>
          <label htmlFor="guest-group-dimension" className="mb-1 block text-sm font-medium text-gray-700">Group by</label>
          <select
            id="guest-group-dimension"
            value={dimension}
            onChange={(event) => setDimension(event.target.value)}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-base shadow-sm focus:border-wine-600 focus:outline-none focus:ring-1 focus:ring-wine-600 sm:text-sm"
          >
            {GUEST_GROUP_DIMENSIONS.map((option) => (
              <option key={option.id} value={option.id}>{option.label}</option>
            ))}
          </select>
        </div>

        {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="rounded-xl border border-wine-100 bg-white p-3">
          {loading ? (
            <p className="text-sm text-gray-500">Loading guests…</p>
          ) : previewGroups.length === 0 ? (
            <p className="text-sm text-gray-500">No groups for this option yet. Guests may be missing this field.</p>
          ) : (
            <>
              <p className="text-sm font-medium text-gray-900">
                {previewGroups.length} group{previewGroups.length === 1 ? '' : 's'} ready
              </p>
              <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-xs text-gray-600">
                {previewGroups.slice(0, 30).map((group, index) => (
                  <li key={`${group.name}-${index}`} className="truncate">
                    <span className="font-medium text-gray-800">{group.name}</span>
                    <span className="text-gray-400"> ({group.members.length})</span>
                    {group.members.length > 0 && <span className="text-gray-500"> — {group.members.join(', ')}</span>}
                  </li>
                ))}
                {previewGroups.length > 30 && (
                  <li className="text-gray-400">…and {previewGroups.length - 30} more</li>
                )}
              </ul>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={submitting || loading || previewGroups.length === 0}>
            {submitting ? 'Creating…' : `Create ${previewGroups.length || ''} group${previewGroups.length === 1 ? '' : 's'}`.trim()}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function ShareLinkCard({ title, description, url }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error('Unable to copy link', error);
    }
  };

  return (
    <div className="rounded-xl border border-wine-100 bg-wine-50/70 p-3 sm:p-4">
      <div className="flex items-center justify-between gap-2 sm:gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900">{title}</p>
          <p className="mt-1 hidden sm:block text-sm text-gray-500">{description}</p>
          <p className="mt-1 sm:mt-2 truncate text-xs text-wine-800 max-w-[calc(100vw-10rem)] sm:max-w-none">{url}</p>
        </div>
        <Button size="sm" variant="outline" onClick={handleCopy} className="shrink-0">
          <Copy size={14} />
          <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
        </Button>
      </div>
    </div>
  );
}

function PhotoGroupAdminCard({
  group,
  index,
  canEdit,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  onSetCurrent,
  onReopen,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: group.id, disabled: !canEdit });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const statusVariant = group.status === 'current'
    ? 'rose'
    : group.status === 'completed'
      ? 'success'
      : 'default';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-xl border border-gray-200 bg-white p-4 shadow-sm ${isDragging ? 'opacity-70 shadow-lg' : ''}`}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          className="mt-1 hidden sm:block text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-40"
          {...attributes}
          {...listeners}
          disabled={!canEdit}
          aria-label="Drag to reorder"
        >
          <GripVertical size={18} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-gray-400">#{index + 1}</span>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 break-words">{group.name}</h3>
            <Badge variant={statusVariant}>{group.status}</Badge>
          </div>
          {group.members?.length > 0 && (
            <p className="mt-2 text-sm leading-relaxed text-gray-500 break-words">{group.members.join(' · ')}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-1 sm:hidden">
            {group.status === 'completed' ? (
              <Button size="sm" variant="outline" onClick={onReopen} disabled={!canEdit}>
                <Undo2 size={14} />
                Put back
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={onSetCurrent} disabled={!canEdit}>
                <Camera size={14} />
                {group.status === 'current' ? 'Live' : 'Set'}
              </Button>
            )}
            <Button aria-label={`Edit ${group.name}`} size="sm" variant="ghost" onClick={onEdit} disabled={!canEdit}>
              <Pencil size={14} />
            </Button>
            <Button aria-label={`Delete ${group.name}`} size="sm" variant="ghost" onClick={onDelete} disabled={!canEdit} className="text-red-600 hover:bg-red-50 hover:text-red-700">
              <Trash2 size={14} />
            </Button>
          </div>
        </div>
        <div className="hidden sm:flex shrink-0 flex-col gap-2 sm:flex-row">
          <div className="flex gap-1">
            <Button aria-label={`Move ${group.name} up`} size="sm" variant="ghost" onClick={onMoveUp} disabled={!canEdit || index === 0}>
              <ChevronUp size={16} />
            </Button>
            <Button aria-label={`Move ${group.name} down`} size="sm" variant="ghost" onClick={onMoveDown} disabled={!canEdit}>
              <ChevronDown size={16} />
            </Button>
          </div>
          <div className="flex gap-1">
            {group.status === 'completed' ? (
              <Button size="sm" variant="outline" onClick={onReopen} disabled={!canEdit}>
                <Undo2 size={15} />
                Put back
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={onSetCurrent} disabled={!canEdit}>
                <Camera size={15} />
                {group.status === 'current' ? 'Live' : 'Set current'}
              </Button>
            )}
            <Button aria-label={`Edit ${group.name}`} size="sm" variant="ghost" onClick={onEdit} disabled={!canEdit}>
              <Pencil size={15} />
            </Button>
            <Button aria-label={`Delete ${group.name}`} size="sm" variant="ghost" onClick={onDelete} disabled={!canEdit} className="text-red-600 hover:bg-red-50 hover:text-red-700">
              <Trash2 size={15} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminPhotoGroupManager({ wedding }) {
  const { groups, loading } = usePhotoGroups(wedding?.id);
  const { currentGroup, pendingGroups, completedGroups, sortedGroups } = useMemo(() => getQueueState(groups), [groups]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [buildOpen, setBuildOpen] = useState(false);
  const { canEdit, isViewer } = useWedding();
  const toast = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const queueLink = wedding?.id ? getPhotoQueueLink(wedding.id, wedding.slug) : '';
  const displayLink = wedding?.id ? getPhotoDisplayLink(wedding.id, wedding.slug) : '';

  const handleSaveGroup = async (payload) => {
    if (!wedding?.id) return;

    if (editingGroup) {
      await updateGroup(wedding.id, editingGroup.id, payload);
    } else {
      await addGroup(wedding.id, payload);
    }

    setModalOpen(false);
    setEditingGroup(null);
  };

  const handleImportGroups = async (parsedGroups) => {
    if (!wedding?.id) return;
    const count = await importGroups(wedding.id, parsedGroups);
    setImportOpen(false);
    setBuildOpen(false);
    toast.success(`Imported ${count} group${count === 1 ? '' : 's'}`);
  };

  const handleDragEnd = async ({ active, over }) => {
    if (!canEdit || !over || active.id === over.id) return;

    const oldIndex = sortedGroups.findIndex((group) => group.id === active.id);
    const newIndex = sortedGroups.findIndex((group) => group.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = [...sortedGroups];
    const [movedGroup] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, movedGroup);
    await reorderGroups(wedding.id, reordered);
  };

  const handleMove = async (groupId, direction) => {
    const index = sortedGroups.findIndex((group) => group.id === groupId);
    const nextIndex = direction === 'up' ? index - 1 : index + 1;

    if (index < 0 || nextIndex < 0 || nextIndex >= sortedGroups.length) return;

    const reordered = [...sortedGroups];
    [reordered[index], reordered[nextIndex]] = [reordered[nextIndex], reordered[index]];
    await reorderGroups(wedding.id, reordered);
  };

  const handleMarkCompleted = async () => {
    if (!currentGroup) return;
    const nextGroup = pendingGroups.find((group) => group.id !== currentGroup.id && group.status !== 'completed');
    try {
      await markCompleted(wedding.id, currentGroup.id, nextGroup?.id || null);
    } catch (error) {
      toast.error(`Could not update the queue: ${error.message}`);
    }
  };

  const pendingCount = pendingGroups.filter((group) => group.status === 'pending').length;
  const hasGroups = sortedGroups.length > 0;

  const handleStartQueue = async () => {
    if (!wedding?.id) return;
    try {
      await startQueue(wedding.id);
      toast.success('Queue started');
    } catch (error) {
      toast.error(`Could not start the queue: ${error.message}`);
    }
  };

  const handleStopQueue = async () => {
    if (!wedding?.id) return;
    try {
      await stopQueue(wedding.id);
      toast.success('Queue stopped');
    } catch (error) {
      toast.error(`Could not stop the queue: ${error.message}`);
    }
  };

  const handleResetQueue = async () => {
    if (!wedding?.id) return;
    const confirmed = window.confirm('Reset the entire queue? Every group goes back to pending and nothing will be live.');
    if (!confirmed) return;
    try {
      await resetQueue(wedding.id);
      toast.success('Queue reset — every group is back to pending');
    } catch (error) {
      toast.error(`Could not reset the queue: ${error.message}`);
    }
  };

  const handleReopenGroup = async (groupId) => {
    if (!wedding?.id) return;
    try {
      await updateGroup(wedding.id, groupId, { status: 'pending' });
    } catch (error) {
      toast.error(`Could not reopen the group: ${error.message}`);
    }
  };

  if (!wedding) {
    return (
      <Card title="Photo Groups">
        <p className="text-sm text-gray-500">Select a wedding to manage the photo queue.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6 overflow-hidden">
      <div className="flex flex-col gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Photo Groups</h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-500">Run a live queue for photographers, the MC, guests, and the venue display.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => window.open(queueLink, '_blank')} disabled={!wedding?.id}>
            <Users size={16} />
            <span className="hidden sm:inline">Guest</span> queue
          </Button>
          <Button size="sm" variant="outline" onClick={() => window.open(displayLink, '_blank')} disabled={!wedding?.id}>
            <MonitorPlay size={16} />
            <span className="hidden sm:inline">Display</span> view
          </Button>
          <Button size="sm" variant="outline" onClick={() => setBuildOpen(true)} disabled={!canEdit}>
            <Sparkles size={16} />
            From guests
          </Button>
          <Button size="sm" variant="outline" onClick={() => setImportOpen(true)} disabled={!canEdit}>
            <Upload size={16} />
            Import CSV
          </Button>
          <Button size="sm" onClick={() => { setEditingGroup(null); setModalOpen(true); }} disabled={!canEdit}>
            <Plus size={16} />
            Add group
          </Button>
        </div>
      </div>

      {isViewer && (
        <Card>
          <p className="text-sm text-amber-700">You have viewer access. Share links and live status are visible, but editing is disabled.</p>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6 min-w-0 overflow-hidden order-2 lg:order-1">
          <div className="grid gap-2 grid-cols-3 sm:gap-4">
            <Card className="border-wine-100 !p-3 sm:!p-4">
              <p className="text-xs sm:text-sm text-gray-500">Pending</p>
              <p className="mt-1 text-2xl sm:text-3xl font-bold text-gray-900">{pendingGroups.filter((group) => group.status === 'pending').length}</p>
            </Card>
            <Card className="border-wine-100 !p-3 sm:!p-4">
              <p className="text-xs sm:text-sm text-gray-500">Current</p>
              <p className="mt-1 text-2xl sm:text-3xl font-bold text-wine-700">{currentGroup ? 1 : 0}</p>
            </Card>
            <Card className="border-wine-100 !p-3 sm:!p-4">
              <p className="text-xs sm:text-sm text-gray-500">Done</p>
              <p className="mt-1 text-2xl sm:text-3xl font-bold text-emerald-600">{completedGroups.length}</p>
            </Card>
          </div>

          {canEdit && (
            <Card className="border-wine-100">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">Queue controls</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {currentGroup ? `Live: ${currentGroup.name}` : pendingCount > 0 ? `${pendingCount} group${pendingCount === 1 ? '' : 's'} waiting` : 'Nothing queued'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={handleStartQueue} disabled={!hasGroups || !!currentGroup || pendingCount === 0}>
                    <Play size={16} />
                    Start
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleStopQueue} disabled={!currentGroup}>
                    <Square size={16} />
                    Stop
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleResetQueue} disabled={!hasGroups} className="text-red-600 hover:bg-red-50 hover:text-red-700">
                    <RotateCcw size={16} />
                    Reset
                  </Button>
                </div>
              </div>
            </Card>
          )}

          <Card
            title="Now on stage"
            actions={currentGroup && canEdit ? <Button size="sm" onClick={handleMarkCompleted}>Mark complete</Button> : null}
            className="border-wine-100"
          >
            {loading ? (
              <p className="text-sm text-gray-500">Loading queue…</p>
            ) : currentGroup ? (
              <div className="rounded-2xl bg-gradient-to-r from-wine-700 to-wine-600 p-6 text-white">
                <p className="text-xs uppercase tracking-[0.3em] text-wine-100">Current group</p>
                <h2 className="mt-3 text-3xl font-bold">{currentGroup.name}</h2>
                {currentGroup.members?.length > 0 && (
                  <p className="mt-3 text-sm leading-relaxed text-wine-50">{currentGroup.members.join(' · ')}</p>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center">
                <p className="font-medium text-gray-900">No group is live right now.</p>
                <p className="mt-1 text-sm text-gray-500">Set any queued group as current to start the display.</p>
              </div>
            )}
          </Card>

          <Card title="Queue" className="border-wine-100">
            {sortedGroups.length === 0 && !loading ? (
              <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center">
                <p className="font-medium text-gray-900">No photo groups yet.</p>
                <p className="mt-1 text-sm text-gray-500">Add your first family or friend group to begin the queue.</p>
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={sortedGroups.map((group) => group.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-3">
                    {sortedGroups.map((group, index) => (
                      <PhotoGroupAdminCard
                        key={group.id}
                        group={group}
                        index={index}
                        canEdit={canEdit}
                        onEdit={() => {
                          setEditingGroup(group);
                          setModalOpen(true);
                        }}
                        onDelete={() => deleteGroup(wedding.id, group.id)}
                        onMoveUp={() => handleMove(group.id, 'up')}
                        onMoveDown={() => handleMove(group.id, 'down')}
                        onSetCurrent={() => setCurrentGroup(wedding.id, group.id)}
                        onReopen={() => handleReopenGroup(group.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </Card>
        </div>

        <div className="space-y-6 min-w-0 overflow-hidden order-1 lg:order-2">
          <Card title="Shareable links" className="border-wine-100">
            <div className="space-y-3">
              <ShareLinkCard
                title="Guest queue"
                description="A public queue guests can open on any phone to see who's up next."
                url={queueLink}
              />
              <ShareLinkCard
                title="Display screen"
                description="A clean big-screen layout for TVs or projectors near the stage."
                url={displayLink}
              />
            </div>
          </Card>
        </div>
      </div>

      <PhotoGroupFormModal
        open={modalOpen}
        group={editingGroup}
        onClose={() => {
          setModalOpen(false);
          setEditingGroup(null);
        }}
        onSubmit={handleSaveGroup}
      />

      <ImportCsvModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={handleImportGroups}
      />

      <BuildFromGuestsModal
        open={buildOpen}
        weddingId={wedding?.id}
        onClose={() => setBuildOpen(false)}
        onImport={handleImportGroups}
      />
    </div>
  );
}

function PublicQueueShell({ wedding, groups, loading, displayMode = false }) {
  const { currentGroup, pendingGroups, completedGroups } = useMemo(() => getQueueState(groups), [groups]);
  const weddingLabel = getWeddingLabel(wedding);
  const nextGroups = pendingGroups.filter((group) => group.status === 'pending');

  if (displayMode) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-12 sm:px-10">
          <header className="text-center">
            <p className="text-xs uppercase tracking-[0.4em] text-wine-200/80">Photo Queue</p>
            <h1 className="mt-4 text-4xl font-semibold text-white sm:text-6xl">{weddingLabel}</h1>
          </header>

          <div className="flex flex-1 items-center justify-center py-12">
            {loading ? (
              <p className="text-xl text-gray-300">Loading queue…</p>
            ) : currentGroup ? (
              <div className="max-w-5xl text-center">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-wine-600/20 px-4 py-2 text-sm text-wine-100">
                  <span className="h-2.5 w-2.5 rounded-full bg-wine-400 animate-pulse" />
                  Now on stage
                </div>
                <h2 className="text-5xl font-bold tracking-tight sm:text-7xl">{currentGroup.name}</h2>
                {currentGroup.members?.length > 0 && (
                  <p className="mt-6 text-xl leading-relaxed text-gray-300 sm:text-2xl">{currentGroup.members.join(' · ')}</p>
                )}
              </div>
            ) : (
              <div className="text-center">
                <Camera className="mx-auto text-wine-300" size={60} />
                <h2 className="mt-5 text-4xl font-semibold">{completedGroups.length > 0 && nextGroups.length === 0 ? 'All groups complete' : 'Beginning shortly'}</h2>
              </div>
            )}
          </div>

          {nextGroups.length > 0 && (
            <section className="border-t border-white/10 pt-8">
              <p className="text-center text-xs uppercase tracking-[0.4em] text-gray-400">Coming up</p>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {nextGroups.slice(0, 3).map((group, index) => (
                  <div key={group.id} className={`rounded-2xl border p-5 ${index === 0 ? 'border-wine-400/40 bg-wine-600/10' : 'border-white/10 bg-white/5'}`}>
                    <p className="text-xs uppercase tracking-[0.3em] text-gray-400">{index === 0 ? 'On deck' : `Next ${index + 1}`}</p>
                    <h3 className="mt-3 text-2xl font-semibold">{group.name}</h3>
                    {group.members?.length > 0 && (
                      <p className="mt-2 text-sm leading-relaxed text-gray-300">{group.members.slice(0, 4).join(' · ')}{group.members.length > 4 ? ` +${group.members.length - 4}` : ''}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    );
  }

  return (
    <WebsiteThemeScope wedding={wedding}>
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, var(--wt-primary-soft), #ffffff 55%, var(--wt-accent-soft))' }}>
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-wine-600">Photo Queue</p>
          <h1 className="mt-3 text-3xl font-bold text-gray-900 sm:text-4xl">{weddingLabel}</h1>
          <p className="mt-3 text-sm text-gray-500">Follow the live queue and be ready when your group is on deck.</p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="border-wine-100">
            {loading ? (
              <p className="text-sm text-gray-500">Loading queue…</p>
            ) : currentGroup ? (
              <div>
                <Badge variant="rose">Now taking photos</Badge>
                <h2 className="mt-4 text-3xl font-bold text-gray-900">{currentGroup.name}</h2>
                {currentGroup.members?.length > 0 && (
                  <p className="mt-3 text-base leading-relaxed text-gray-600">{currentGroup.members.join(' · ')}</p>
                )}
              </div>
            ) : (
              <div className="text-center py-10">
                <Camera className="mx-auto text-wine-400" size={36} />
                <p className="mt-4 text-lg font-semibold text-gray-900">No group is live yet</p>
                <p className="mt-1 text-sm text-gray-500">Check back in a moment for the next call.</p>
              </div>
            )}
          </Card>

          <Card title="Up next" className="border-wine-100">
            <div className="space-y-3">
              {nextGroups.slice(0, 5).map((group, index) => (
                <div key={group.id} className="rounded-xl border border-gray-100 px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-gray-900">{group.name}</p>
                    <Badge>{index === 0 ? 'On deck' : `#${index + 1}`}</Badge>
                  </div>
                  {group.members?.length > 0 && (
                    <p className="mt-1 text-sm text-gray-500">{group.members.join(' · ')}</p>
                  )}
                </div>
              ))}
              {nextGroups.length === 0 && <p className="text-sm text-gray-500">No groups waiting in the queue.</p>}
            </div>
          </Card>
        </div>

        <Card title="Full queue" className="mt-6 border-wine-100">
          <div className="space-y-3">
            {groups.map((group) => (
              <div key={group.id} className="rounded-xl border border-gray-100 px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-gray-900">{group.name}</p>
                  <Badge
                    variant={group.status === 'current' ? 'rose' : group.status === 'completed' ? 'success' : 'default'}
                  >
                    {group.status}
                  </Badge>
                </div>
                {group.members?.length > 0 && (
                  <p className="mt-1 text-sm text-gray-500">{group.members.join(' · ')}</p>
                )}
              </div>
            ))}
            {groups.length === 0 && !loading && <p className="text-sm text-gray-500">The queue has not been set up yet.</p>}
          </div>
        </Card>
      </main>
    </div>
    </WebsiteThemeScope>
  );
}

export default function PhotoGroupManager() {
  const { activeWedding } = useWedding();
  return <AdminPhotoGroupManager wedding={activeWedding} />;
}

export function PublicPhotoGroupQueue() {
  const { weddingId: rawParam } = useParams();
  const [weddingId, setWeddingId] = useState(rawParam);
  useEffect(() => { resolveWeddingId(rawParam).then(setWeddingId).catch(() => setWeddingId(null)); }, [rawParam]);
  const wedding = useWeddingPublicData(weddingId);
  const { groups, loading } = usePhotoGroups(weddingId);

  return <PublicQueueShell wedding={wedding} groups={groups} loading={loading} />;
}

export function PhotoGroupDisplayView() {
  const { weddingId: rawParam } = useParams();
  const [weddingId, setWeddingId] = useState(rawParam);
  useEffect(() => { resolveWeddingId(rawParam).then(setWeddingId).catch(() => setWeddingId(null)); }, [rawParam]);
  const wedding = useWeddingPublicData(weddingId);
  const { groups, loading } = usePhotoGroups(weddingId);

  return <PublicQueueShell wedding={wedding} groups={groups} loading={loading} displayMode />;
}
