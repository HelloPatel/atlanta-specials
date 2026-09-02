import { useState, useEffect } from 'react';
import { useWedding } from '../../contexts/WeddingContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  addCollaborator,
  removeCollaborator,
  updateCollaboratorRole,
  subscribeToCollaborators,
  createCustomRole,
  updateCustomRole,
  deleteCustomRole,
  PERMISSION_FEATURES,
  COLLAB_ROLES,
} from '../../services/collaborationService';
import { Button, Modal, Badge, useToast } from '../ui';
import {
  UserPlus, Trash2, Shield, Eye, Edit3, Crown, Briefcase, Dices,
  SlidersHorizontal, Plus, Pencil,
} from 'lucide-react';

// Metadata for every assignable built-in collaborator role.
const ROLE_META = {
  editor:  { label: 'Editor',  Icon: Edit3,     color: 'text-blue-600',    avatar: 'bg-blue-100 text-blue-700',       badge: 'primary', desc: 'Full access. Can add guests, edit events, manage seating' },
  planner: { label: 'Planner', Icon: Briefcase, color: 'text-emerald-600', avatar: 'bg-emerald-100 text-emerald-700', badge: 'success', desc: 'Edit Photo Groups & Games, read-only Events & Seating. Cannot see guest info' },
  dealer:  { label: 'Dealer',  Icon: Dices,     color: 'text-amber-600',   avatar: 'bg-amber-100 text-amber-700',     badge: 'warning', desc: 'Runs the Games (bets) page only' },
  viewer:  { label: 'Viewer',  Icon: Eye,       color: 'text-gray-600',    avatar: 'bg-gray-200 text-gray-600',       badge: 'default', desc: 'Read-only. Can see everything but cannot make changes' },
};

const BUILTIN_ROLE_KEYS = ['editor', 'planner', 'dealer', 'viewer'];

const featureLabel = (key) => PERMISSION_FEATURES.find((f) => f.key === key)?.label || key;

// Plain-language summary of a custom role's permissions for badges/descriptions.
function summarizePermissions(role) {
  const edit = role.edit || [];
  const viewOnly = (role.view || []).filter((f) => !edit.includes(f));
  const parts = [];
  if (edit.length) parts.push(`Edit ${edit.map(featureLabel).join(', ')}`);
  if (viewOnly.length) parts.push(`View ${viewOnly.map(featureLabel).join(', ')}`);
  if (!parts.length) return 'No pages granted yet';
  return parts.join(' · ');
}

// Resolve display metadata for any role string (built-in key or custom role id).
function roleMetaFor(role, customRoles) {
  if (ROLE_META[role]) return ROLE_META[role];
  const cr = customRoles.find((r) => r.id === role);
  if (cr) {
    return {
      label: cr.name,
      Icon: SlidersHorizontal,
      color: 'text-wine-700',
      avatar: 'bg-wine-100 text-wine-700',
      badge: 'primary',
      desc: summarizePermissions(cr),
    };
  }
  return ROLE_META.viewer;
}

// Three-state segmented control for a single feature's access level.
function PermSegment({ value = 'none', onChange }) {
  const opts = [
    { v: 'none', label: 'No access' },
    { v: 'view', label: 'View' },
    { v: 'edit', label: 'Edit' },
  ];
  return (
    <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
      {opts.map((o) => (
        <button
          key={o.v}
          type="button"
          onClick={() => onChange(o.v)}
          className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors duration-150 ${
            value === o.v ? 'bg-white text-wine-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function CollaboratorsPanel() {
  const { activeWedding } = useWedding();
  const toast = useToast();
  const { user } = useAuth();
  const [collaborators, setCollaborators] = useState([]);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState(COLLAB_ROLES.EDITOR);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Custom role builder state.
  const [showRoleBuilder, setShowRoleBuilder] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [roleName, setRoleName] = useState('');
  const [rolePerms, setRolePerms] = useState({}); // { [featureKey]: 'none' | 'view' | 'edit' }
  const [roleGuestPII, setRoleGuestPII] = useState(true);
  const [roleError, setRoleError] = useState('');
  const [savingRole, setSavingRole] = useState(false);

  const customRoles = activeWedding?.customRoles || [];

  useEffect(() => {
    if (!activeWedding) return;
    return subscribeToCollaborators(activeWedding.id, setCollaborators);
  }, [activeWedding]);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setError('');
    setLoading(true);
    try {
      await addCollaborator(activeWedding.id, {
        email: inviteEmail.trim(),
        role: inviteRole,
        name: inviteName.trim(),
      });
      setInviteEmail('');
      setInviteName('');
      setShowInvite(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (collabId) => {
    if (!confirm('Remove this collaborator?')) return;
    try {
      await removeCollaborator(activeWedding.id, collabId);
    } catch (err) {
      console.error('Failed to remove collaborator:', err);
      toast.error('Failed to remove collaborator. Please try again.');
    }
  };

  const handleRoleChange = async (collabId, newRole) => {
    try {
      await updateCollaboratorRole(activeWedding.id, collabId, newRole);
    } catch (err) {
      console.error('Failed to update role:', err);
      toast.error('Failed to update role. Please try again.');
    }
  };

  // ─── Custom role builder helpers ──────────────────────────────────────────

  const openNewRole = () => {
    setEditingRoleId(null);
    setRoleName('');
    setRolePerms({});
    setRoleGuestPII(true);
    setRoleError('');
    setShowRoleBuilder(true);
  };

  const openEditRole = (role) => {
    setEditingRoleId(role.id);
    setRoleName(role.name);
    const perms = {};
    (role.view || []).forEach((f) => { perms[f] = 'view'; });
    (role.edit || []).forEach((f) => { perms[f] = 'edit'; });
    setRolePerms(perms);
    setRoleGuestPII(role.viewGuestPII !== false);
    setRoleError('');
    setShowRoleBuilder(true);
  };

  const setPerm = (feature, level) =>
    setRolePerms((prev) => ({ ...prev, [feature]: level }));

  const handleSaveRole = async () => {
    setRoleError('');
    if (!roleName.trim()) { setRoleError('Give the role a name'); return; }

    const view = [];
    const edit = [];
    Object.entries(rolePerms).forEach(([feature, level]) => {
      if (level === 'view') view.push(feature);
      if (level === 'edit') { view.push(feature); edit.push(feature); }
    });
    if (!view.length) { setRoleError('Grant access to at least one page'); return; }

    setSavingRole(true);
    try {
      if (editingRoleId) {
        await updateCustomRole(activeWedding.id, editingRoleId, {
          name: roleName, view, edit, viewGuestPII: roleGuestPII,
        });
      } else {
        const created = await createCustomRole(activeWedding.id, {
          name: roleName, view, edit, viewGuestPII: roleGuestPII,
        });
        // Pre-select the freshly made role for the next invite.
        setInviteRole(created.id);
      }
      setShowRoleBuilder(false);
    } catch (err) {
      setRoleError(err.message);
    } finally {
      setSavingRole(false);
    }
  };

  const handleDeleteRole = async (roleId) => {
    if (!confirm('Delete this custom role? Anyone using it becomes a Viewer.')) return;
    try {
      await deleteCustomRole(activeWedding.id, roleId);
      if (inviteRole === roleId) setInviteRole(COLLAB_ROLES.EDITOR);
    } catch (err) {
      console.error('Failed to delete custom role:', err);
      toast.error('Failed to delete role. Please try again.');
    }
  };

  const isOwner = activeWedding?.ownerId === user?.uid;

  if (!activeWedding) return null;

  const inviteRoleOptions = [...BUILTIN_ROLE_KEYS, ...customRoles.map((r) => r.id)];

  return (
    <div className="space-y-4">
      {/* Team */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Shield size={16} className="text-wine-700" />
          Wedding Team
        </h3>

        <div className="space-y-2">
          {/* Owner row */}
          <div className="flex items-center gap-3 px-3 py-2.5 bg-wine-50 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-wine-700 text-white flex items-center justify-center text-sm font-bold">
              <Crown size={14} />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">
                {activeWedding.ownerName || user?.email || 'Owner'}
              </div>
              <div className="text-xs text-gray-500">{activeWedding.ownerEmail || user?.email}</div>
            </div>
            <Badge variant="primary">Owner</Badge>
          </div>

          {/* Collaborators */}
          {collaborators.map((collab) => {
            const meta = roleMetaFor(collab.role, customRoles);
            const RoleIcon = meta.Icon;
            return (
              <div key={collab.id} className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 rounded-lg">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${meta.avatar}`}>
                  <RoleIcon size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {collab.name || collab.email}
                  </div>
                  <div className="text-xs text-gray-500 truncate">{collab.email}</div>
                </div>

                {isOwner && (
                  <>
                    <select
                      value={collab.role}
                      onChange={(e) => handleRoleChange(collab.id, e.target.value)}
                      className="rounded border border-gray-200 px-2 py-1 text-xs max-w-[9rem]"
                    >
                      <optgroup label="Built-in">
                        <option value="editor">Editor (full access)</option>
                        <option value="planner">Planner (photos &amp; games)</option>
                        <option value="dealer">Dealer (games only)</option>
                        <option value="viewer">Viewer (read-only)</option>
                      </optgroup>
                      {customRoles.length > 0 && (
                        <optgroup label="Custom roles">
                          {customRoles.map((r) => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                    <button
                      onClick={() => handleRemove(collab.id)}
                      className="p-1.5 rounded hover:bg-red-50 text-red-500"
                      title="Remove"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}

                {!isOwner && (
                  <Badge variant={meta.badge}>{meta.label}</Badge>
                )}
              </div>
            );
          })}

          {collaborators.length === 0 && (
            <p className="text-xs text-gray-400 px-3 py-2">
              No collaborators yet. Invite your spouse or parents to help plan!
            </p>
          )}
        </div>

        {isOwner && (
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button size="sm" onClick={() => setShowInvite(true)}>
              <UserPlus size={14} /> Invite Collaborator
            </Button>
            <Button size="sm" variant="secondary" onClick={openNewRole}>
              <SlidersHorizontal size={14} /> Create Custom Role
            </Button>
          </div>
        )}
      </div>

      {/* Custom roles management */}
      {isOwner && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <SlidersHorizontal size={13} className="text-wine-700" /> Custom Roles
            </h4>
            <button
              onClick={openNewRole}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-wine-700 hover:bg-wine-50"
            >
              <Plus size={13} /> New role
            </button>
          </div>

          {customRoles.length === 0 ? (
            <p className="text-xs text-gray-400">
              Build a role with exactly the pages a person needs. For example, let parents{' '}
              <strong>edit the Budget</strong> while only viewing everything else.
            </p>
          ) : (
            <div className="space-y-2">
              {customRoles.map((role) => (
                <div key={role.id} className="flex items-start gap-3 rounded-lg bg-gray-50 px-3 py-2.5">
                  <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-wine-100 text-wine-700">
                    <SlidersHorizontal size={13} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900">{role.name}</div>
                    <div className="text-xs text-gray-500">{summarizePermissions(role)}</div>
                    {role.viewGuestPII === false && (
                      <div className="mt-0.5 text-[11px] font-medium text-amber-600">Guest contact info hidden</div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditRole(role)}
                      className="rounded p-1.5 text-gray-500 hover:bg-white"
                      title="Edit role"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => handleDeleteRole(role.id)}
                      className="rounded p-1.5 text-red-500 hover:bg-red-50"
                      title="Delete role"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Role info */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Roles</h4>
        <div className="space-y-2 text-xs text-gray-600">
          <div className="flex items-start gap-2">
            <Crown size={12} className="text-wine-700 mt-0.5 flex-shrink-0" />
            <div><strong>Owner</strong>: Full control, manage collaborators, delete wedding</div>
          </div>
          {BUILTIN_ROLE_KEYS.map((role) => {
            const meta = ROLE_META[role];
            const RoleIcon = meta.Icon;
            return (
              <div key={role} className="flex items-start gap-2">
                <RoleIcon size={12} className={`${meta.color} mt-0.5 flex-shrink-0`} />
                <div><strong>{meta.label}</strong>: {meta.desc}</div>
              </div>
            );
          })}
          {customRoles.map((role) => (
            <div key={role.id} className="flex items-start gap-2">
              <SlidersHorizontal size={12} className="text-wine-700 mt-0.5 flex-shrink-0" />
              <div><strong>{role.name}</strong>: {summarizePermissions(role)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Invite modal */}
      <Modal open={showInvite} onClose={() => { setShowInvite(false); setError(''); }} title="Invite Collaborator" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Invite your spouse, parents, or wedding planner to help manage your wedding.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              placeholder="e.g. Mom, Anjali, Wedding Planner"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-wine-600 focus:ring-1 focus:ring-wine-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="their-email@example.com"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-wine-600 focus:ring-1 focus:ring-wine-600"
            />
            <p className="text-xs text-gray-400 mt-1">They'll need to sign up with this email to access the wedding</p>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <button
                type="button"
                onClick={openNewRole}
                className="inline-flex items-center gap-1 text-xs font-medium text-wine-700 hover:underline"
              >
                <Plus size={12} /> Custom role
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {inviteRoleOptions.map((role) => {
                const meta = roleMetaFor(role, customRoles);
                const RoleIcon = meta.Icon;
                const selected = inviteRole === role;
                return (
                  <button
                    key={role}
                    onClick={() => setInviteRole(role)}
                    className={`rounded-lg border p-3 text-left transition-colors ${
                      selected ? 'border-wine-500 bg-wine-50' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <RoleIcon size={14} className={meta.color} />
                      <span className="text-sm font-medium">{meta.label}</span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2">{meta.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <Button onClick={handleInvite} className="w-full" disabled={loading || !inviteEmail.trim()}>
            {loading ? 'Inviting...' : 'Send Invite'}
          </Button>
        </div>
      </Modal>

      {/* Custom role builder modal */}
      <Modal
        open={showRoleBuilder}
        onClose={() => { setShowRoleBuilder(false); setRoleError(''); }}
        title={editingRoleId ? 'Edit Custom Role' : 'Create Custom Role'}
        size="lg"
      >
        <div className="space-y-5">
          <p className="text-sm text-gray-600">
            Name the role and choose what each person can do, page by page. Give parents
            edit access to the Budget while keeping everything else view-only.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role name</label>
            <input
              type="text"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              placeholder="e.g. Parents, Finance Helper, Family Elder"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-wine-600 focus:ring-1 focus:ring-wine-600"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Page permissions</label>
            <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
              {PERMISSION_FEATURES.map((f) => (
                <div key={f.key} className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <span className="text-sm text-gray-800">{f.label}</span>
                  <PermSegment
                    value={rolePerms[f.key] || 'none'}
                    onChange={(level) => setPerm(f.key, level)}
                  />
                </div>
              ))}
            </div>
            <p className="mt-1 text-xs text-gray-400">Edit access always includes viewing.</p>
          </div>

          {/* Guest privacy toggle */}
          <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-3">
            <div className="min-w-0">
              <div className="text-sm font-medium text-gray-800">Show guest contact &amp; personal info</div>
              <div className="text-xs text-gray-500">Names, email, phone, and dietary notes on Guest List &amp; RSVPs</div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={roleGuestPII}
              onClick={() => setRoleGuestPII((v) => !v)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-200 ${
                roleGuestPII ? 'bg-wine-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                  roleGuestPII ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {roleError && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{roleError}</p>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => { setShowRoleBuilder(false); setRoleError(''); }}>
              Cancel
            </Button>
            <Button onClick={handleSaveRole} disabled={savingRole || !roleName.trim()}>
              {savingRole ? 'Saving...' : editingRoleId ? 'Save Changes' : 'Create Role'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
