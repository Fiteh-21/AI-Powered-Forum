import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CheckCircle, XCircle, AlertTriangle,
  ShieldCheck, User, Trash2,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { adminService } from '../../services/admin/admin.service.js';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Admin.module.css';
import ui from '../../styles/pageStates.module.css';

const TABS = [
  { key: 'queue', label: 'Mod Queue' },
  { key: 'flags', label: 'Flag Activity' },
  { key: 'users', label: 'User Management' },
];

const CATEGORY_LABELS = {
  spam: 'Spam', harassment: 'Harassment', off_topic: 'Off-topic', low_quality: 'Low quality',
};

const FLAG_FILTERS = ['all', 'pending', 'approved', 'removed'];

// ── Helpers ───────────────────────────────────────────────────────────────────
function Avatar({ firstName, lastName, size = 'md' }) {
  return (
    <div className={`${styles.avatar} ${styles[`avatar--${size}`]}`}>
      {firstName?.[0]}{lastName?.[0]}
    </div>
  );
}

function Pagination({ meta, totalPages, onPage }) {
  if (totalPages <= 1) return null;
  return (
    <div className={styles.pagination}>
      <button type="button" className={styles.pageBtn}
        onClick={() => onPage(meta.page - 1)} disabled={meta.page <= 1}>
        <ChevronLeft size={16} />
      </button>
      <span className={styles.pageLabel}>Page {meta.page} of {totalPages}</span>
      <button type="button" className={styles.pageBtn}
        onClick={() => onPage(meta.page + 1)} disabled={meta.page >= totalPages}>
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

// ── Mod Queue tab ─────────────────────────────────────────────────────────────
function QueueTab() {
  const [posts, setPosts]             = useState([]);
  const [meta, setMeta]               = useState({ total: 0, page: 1, limit: 20 });
  const [isLoading, setIsLoading]     = useState(true);
  const [error, setError]             = useState(null);
  const [actioningId, setActioningId] = useState(null);
  const [actionMsg, setActionMsg]     = useState(null);

  const fetchQueue = useCallback(async (page = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await adminService.getQueue({ page, limit: 20 });
      setPosts(result.data || []);
      setMeta(result.meta || { total: 0, page, limit: 20 });
    } catch (err) {
      setError(err.message || 'Failed to load moderation queue.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchQueue(1); }, [fetchQueue]);

  const handleAction = async (flagId, action) => {
    if (actioningId === flagId) return;
    setActioningId(flagId);
    setActionMsg(null);
    try {
      const fn = action === 'approve' ? adminService.approvePost
               : action === 'remove'  ? adminService.removePost
               : adminService.escalatePost;
      const result = await fn(flagId);
      setActionMsg(result.message || 'Done.');
      setPosts(prev => prev.filter(p => p.flagId !== flagId));
    } catch (err) {
      setActionMsg(err.message || 'Action failed.');
    } finally {
      setActioningId(null);
    }
  };

  const totalPages = Math.ceil(meta.total / meta.limit);

  return (
    <div className={styles.tabContent}>
      {actionMsg && <div className={styles.banner}>{actionMsg}</div>}

      {isLoading && (
        <p className={`${ui.pageStates__message} ${ui['pageStates__message--loading']}`}>
          Loading moderation queue...
        </p>
      )}
      {!isLoading && error && (
        <p className={`${ui.pageStates__message} ${ui['pageStates__message--error']}`}>{error}</p>
      )}
      {!isLoading && !error && posts.length === 0 && (
        <div className={`${ui.pageStates__message} ${ui['pageStates__message--empty']}`}>
          No posts pending review. The queue is clear.
        </div>
      )}
      {!isLoading && !error && posts.length > 0 && (
        <>
          <p className={styles.count}>{meta.total} post{meta.total !== 1 ? 's' : ''} pending review</p>
          <div className={styles.list}>
            {posts.map(post => (
              <article key={post.flagId} className={styles.card} data-category={post.moderationCategory}>
                <div className={styles.cardBody}>
                  <div className={styles.cardMeta}>
                    <span className={`${styles.categoryPill} ${styles[`categoryPill--${post.moderationCategory}`]}`}>
                      {CATEGORY_LABELS[post.moderationCategory] || post.moderationCategory}
                    </span>
                    <span className={styles.postTypePill}>{post.postType}</span>
                    <span className={`${styles.metaText} ${styles['metaText--right']}`}>
                      AI score: {(post.moderationScore * 100).toFixed(0)}%
                    </span>
                    <span className={styles.metaText}>
                      {post.flaggedAt ? new Date(post.flaggedAt).toLocaleDateString() : ''}
                    </span>
                  </div>

                  <p className={styles.content}>{post.content}</p>
                  <p className={styles.aiReason}>{post.aiReason}</p>

                  <div className={styles.authorRow}>
                    <Avatar firstName={post.author?.firstName} lastName={post.author?.lastName} size="sm" />
                    <div>
                      <span className={styles.authorName}>
                        {post.author?.firstName} {post.author?.lastName}
                      </span>
                      <span className={styles.metaText}>
                        {' · '}{post.author?.incidentCount ?? 0} prior incident{post.author?.incidentCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={styles.cardFooter}>
                  <div className={styles.actions}>
                    <button type="button"
                      className={`${styles.actionBtn} ${styles['actionBtn--approve']}`}
                      onClick={() => handleAction(post.flagId, 'approve')}
                      disabled={actioningId === post.flagId}>
                      <CheckCircle size={14} /> Approve
                    </button>
                    <button type="button"
                      className={`${styles.actionBtn} ${styles['actionBtn--remove']}`}
                      onClick={() => handleAction(post.flagId, 'remove')}
                      disabled={actioningId === post.flagId}>
                      <XCircle size={14} /> Remove
                    </button>
                    <button type="button"
                      className={`${styles.actionBtn} ${styles['actionBtn--escalate']}`}
                      onClick={() => handleAction(post.flagId, 'escalate')}
                      disabled={actioningId === post.flagId}>
                      <AlertTriangle size={14} /> Escalate
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <Pagination meta={meta} totalPages={totalPages} onPage={fetchQueue} />
        </>
      )}
    </div>
  );
}

// ── User Management tab ───────────────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers]             = useState([]);
  const [meta, setMeta]               = useState({ total: 0, page: 1, limit: 20 });
  const [isLoading, setIsLoading]     = useState(true);
  const [error, setError]             = useState(null);
  const [togglingId, setTogglingId]   = useState(null);
  const [deletingId, setDeletingId]   = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [actionMsg, setActionMsg]     = useState(null);

  const fetchUsers = useCallback(async (page = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await adminService.getUsers({ page, limit: 20 });
      setUsers(result.data || []);
      setMeta(result.meta || { total: 0, page, limit: 20 });
    } catch (err) {
      setError(err.message || 'Failed to load users.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(1); }, [fetchUsers]);

  const handleToggleRole = async (user) => {
    if (togglingId === user.userId) return;
    setTogglingId(user.userId);
    setActionMsg(null);
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    try {
      await adminService.updateUserRole(user.userId, newRole);
      setUsers(prev => prev.map(u =>
        u.userId === user.userId ? { ...u, role: newRole } : u
      ));
      setActionMsg(`${user.firstName} ${user.lastName} is now "${newRole}".`);
    } catch (err) {
      setActionMsg(err.message || 'Role update failed.');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (user) => {
    if (deletingId === user.userId) return;
    setDeletingId(user.userId);
    setConfirmDeleteId(null);
    setActionMsg(null);
    try {
      const result = await adminService.deleteUser(user.userId);
      setUsers(prev => prev.filter(u => u.userId !== user.userId));
      setMeta(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }));
      setActionMsg(result.message || 'User removed.');
    } catch (err) {
      setActionMsg(err.message || 'Delete failed.');
    } finally {
      setDeletingId(null);
    }
  };

  const totalPages = Math.ceil(meta.total / meta.limit);

  return (
    <div className={styles.tabContent}>
      {actionMsg && <div className={styles.banner}>{actionMsg}</div>}

      {isLoading && (
        <p className={`${ui.pageStates__message} ${ui['pageStates__message--loading']}`}>
          Loading users...
        </p>
      )}
      {!isLoading && error && (
        <p className={`${ui.pageStates__message} ${ui['pageStates__message--error']}`}>{error}</p>
      )}
      {!isLoading && !error && (
        <>
          <p className={styles.count}>{meta.total} user{meta.total !== 1 ? 's' : ''}</p>
          <table className={styles.userTable}>
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Trust</th>
                <th>Answers</th>
                <th>Incidents</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.userId} className={user.moderationStatus === 'removed' ? styles.rowRemoved : ''}>
                  <td>
                    <div className={styles.colIdentity}>
                      <Avatar firstName={user.firstName} lastName={user.lastName} size="sm" />
                      <div className={styles.identityText}>
                        <p className={styles.userName}>{user.firstName} {user.lastName}</p>
                        <p className={styles.userEmail}>{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`${styles.rolePill} ${styles[`rolePill--${user.role}`]}`}>
                      {user.role === 'admin' ? <ShieldCheck size={11} /> : <User size={11} />}
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.statusPill} ${styles[`status--${user.moderationStatus}`]}`}>
                      {user.moderationStatus}
                    </span>
                  </td>
                  <td className={styles.statCell}>{user.trustScore}</td>
                  <td className={styles.statCell}>{user.totalAnswers}</td>
                  <td className={styles.statCell}>
                    {user.incidentCount > 0
                      ? <span className={styles.incidentChip}>{user.incidentCount}</span>
                      : <span style={{ color: 'var(--text-tertiary)' }}>—</span>
                    }
                  </td>
                  <td>
                    <div className={styles.actionCell}>
                      <button type="button" className={styles.roleToggle}
                        onClick={() => handleToggleRole(user)}
                        disabled={togglingId === user.userId || user.moderationStatus === 'removed'}>
                        {user.role === 'admin' ? 'Demote' : 'Make admin'}
                      </button>

                      {confirmDeleteId === user.userId ? (
                        <div className={styles.confirmRow}>
                          <span className={styles.confirmText}>Sure?</span>
                          <button type="button" className={`${styles.confirmBtn} ${styles['confirmBtn--yes']}`}
                            onClick={() => handleDelete(user)}
                            disabled={deletingId === user.userId}>
                            Yes
                          </button>
                          <button type="button" className={`${styles.confirmBtn} ${styles['confirmBtn--no']}`}
                            onClick={() => setConfirmDeleteId(null)}>
                            No
                          </button>
                        </div>
                      ) : (
                        <button type="button" className={styles.deleteBtn}
                          onClick={() => setConfirmDeleteId(user.userId)}
                          disabled={user.moderationStatus === 'removed'}
                          title="Remove user from platform">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination meta={meta} totalPages={totalPages} onPage={fetchUsers} />
        </>
      )}
    </div>
  );
}

// ── Flag Activity tab ─────────────────────────────────────────────────────────
function FlagsTab() {
  const [flags, setFlags]         = useState([]);
  const [meta, setMeta]           = useState({ total: 0, page: 1, limit: 20 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState(null);
  const [filter, setFilter]       = useState('all');

  const fetchFlags = useCallback(async (page = 1, status = filter) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await adminService.getFlagHistory({ page, limit: 20, status });
      setFlags(result.data || []);
      setMeta(result.meta || { total: 0, page, limit: 20 });
    } catch (err) {
      setError(err.message || 'Failed to load flag history.');
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchFlags(1, filter); }, [filter, fetchFlags]);

  const totalPages = Math.ceil(meta.total / meta.limit);

  return (
    <div className={styles.tabContent}>
      <div className={styles.filterRow}>
        {FLAG_FILTERS.map(f => (
          <button key={f} type="button"
            className={`${styles.filterBtn} ${filter === f ? styles['filterBtn--active'] : ''}`}
            onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {isLoading && (
        <p className={`${ui.pageStates__message} ${ui['pageStates__message--loading']}`}>
          Loading flag history...
        </p>
      )}
      {!isLoading && error && (
        <p className={`${ui.pageStates__message} ${ui['pageStates__message--error']}`}>{error}</p>
      )}
      {!isLoading && !error && flags.length === 0 && (
        <div className={`${ui.pageStates__message} ${ui['pageStates__message--empty']}`}>
          No flag records for this filter.
        </div>
      )}
      {!isLoading && !error && flags.length > 0 && (
        <>
          <p className={styles.count}>{meta.total} record{meta.total !== 1 ? 's' : ''}</p>
          <div className={styles.list}>
            {flags.map(flag => (
              <div key={flag.flagId} className={styles.flagCard} data-category={flag.category} data-status={flag.status}>
                <div className={styles.cardBody}>
                  <div className={styles.cardMeta}>
                    <span className={`${styles.categoryPill} ${styles[`categoryPill--${flag.category}`]}`}>
                      {CATEGORY_LABELS[flag.category] || flag.category}
                    </span>
                    <span className={styles.postTypePill}>{flag.postType}</span>
                    <span className={`${styles.flagStatusPill} ${styles[`flagStatus--${flag.status}`]}`}>
                      {flag.status}
                    </span>
                    <span className={`${styles.metaText} ${styles['metaText--right']}`}>
                      AI: {(flag.moderationScore * 100).toFixed(0)}%
                    </span>
                    <span className={styles.metaText}>
                      {flag.flaggedAt ? new Date(flag.flaggedAt).toLocaleDateString() : ''}
                    </span>
                  </div>

                  <p className={styles.content}>{flag.content}</p>
                  <p className={styles.aiReason}>{flag.aiReason}</p>
                </div>

                <div className={styles.cardFooter}>
                  <div className={styles.flagFooter}>
                    <div className={styles.authorRow}>
                      <Avatar firstName={flag.author?.firstName} lastName={flag.author?.lastName} size="sm" />
                      <span className={styles.authorName}>
                        {flag.author?.firstName} {flag.author?.lastName}
                      </span>
                      {flag.author?.incidentCount > 0 && (
                        <span className={styles.incidentChip}>
                          {flag.author.incidentCount} incident{flag.author.incidentCount !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    {flag.reviewedBy && (
                      <span className={styles.metaText}>
                        Reviewed by {flag.reviewedBy} · {flag.reviewedAt ? new Date(flag.reviewedAt).toLocaleDateString() : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Pagination meta={meta} totalPages={totalPages} onPage={p => fetchFlags(p, filter)} />
        </>
      )}
    </div>
  );
}

// ── Page shell ────────────────────────────────────────────────────────────────
const VALID_TABS = TABS.map(t => t.key);

export default function Admin() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab = VALID_TABS.includes(tabParam) ? tabParam : 'queue';

  const setActiveTab = (key) => {
    setSearchParams({ tab: key }, { replace: true });
  };

  // Client-side role gate. The API already blocks non-admins, but without this a
  // non-admin who navigates straight to /admin would just hit repeated 403s.
  if (user && user.role !== 'admin') {
    return (
      <div className={styles.page} style={{ padding: '3rem', textAlign: 'center' }}>
        <ShieldCheck size={28} aria-hidden />
        <h2>Admin access required</h2>
        <p>You don’t have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.tabBar}>
        {TABS.map(tab => (
          <button key={tab.key} type="button"
            className={`${styles.tab} ${activeTab === tab.key ? styles['tab--active'] : ''}`}
            onClick={() => setActiveTab(tab.key)}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'queue' && <QueueTab />}
      {activeTab === 'users' && <UsersTab />}
      {activeTab === 'flags' && <FlagsTab />}
    </div>
  );
}
