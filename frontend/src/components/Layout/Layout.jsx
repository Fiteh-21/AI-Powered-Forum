import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { releasesService } from '../../services/releases/releases.service.js';
import Navbar from '../Navbar/Navbar.jsx';
import Sidebar from '../Sidebar/Sidebar.jsx';
import WhatsNewModal from '../WhatsNewModal/WhatsNewModal.jsx';
import styles from './Layout.module.css';

/**
 * Authenticated shell: fixed sidebar + scrollable main column + footer.
 * Add new `pathname` branches below when you introduce more protected routes.
 */
export default function Layout() {
  const location = useLocation();
  const { user, logout } = useAuth();

  /* ── Changelog / "What's New" state ── */
  const [releases, setReleases] = useState([]);      // releases shown in the modal
  const [showModal, setShowModal] = useState(false);
  const [hasUnseen, setHasUnseen] = useState(false); // drives the navbar bell badge
  const checkedUserRef = useRef(null);               // id of the user we last ran the unseen check for

  // On login, check for unseen releases and auto-open the modal if any exist.
  // Tracking the user id (not a one-shot boolean) means a different user logging
  // in during the same session gets their own check, and logout resets it.
  useEffect(() => {
    if (!user) { checkedUserRef.current = null; return; }
    if (checkedUserRef.current === user.id) return;
    checkedUserRef.current = user.id;

    releasesService
      .getUnseen()
      .then(({ data, count }) => {
        if (count > 0) {
          setReleases(data);
          setHasUnseen(true);
          setShowModal(true);
        }
      })
      .catch(() => {/* non-fatal: changelog is best-effort */});
  }, [user]);

  // Dismissing the auto-shown modal marks everything seen and clears the badge.
  const handleCloseModal = () => {
    setShowModal(false);
    if (hasUnseen) {
      setHasUnseen(false);
      releasesService.markSeen().catch(() => {});
    }
  };

  // Bell click: always fetch the recent-releases view (even if already seen), so
  // it doesn't reopen the narrower unseen subset that may be in state from login.
  const handleBellClick = async () => {
    try {
      const recent = await releasesService.getRecent();
      setReleases(recent);
    } catch {/* keep whatever we have */}
    setShowModal(true);
  };

  /** Navbar title: keep in sync with routes in `App.jsx`. */
  const getTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Home';
    if (path === '/my-questions') return 'Your topics';
    if (path === '/questions/ask') return 'Ask a question';
    if (path.startsWith('/questions/')) return 'Discussion';
    if (path === '/rag-documents') return 'Knowledge base';
    if (path === '/leaderboard') return 'Leaderboard';
    if (path.startsWith('/users/') && path.endsWith('/profile')) return 'Profile';
    if (path === '/admin') return 'Admin';
    return 'Forum';
  };

  /** One-line context under the title (helps students orient on each screen). */
  const getSubtitle = () => {
    const path = location.pathname;
    if (path === '/dashboard')
      return 'Browse the feed, search by keyword, or run AI similarity search.';
    if (path === '/my-questions')
      return 'Questions you have posted. Open any thread to read replies or edit context.';
    if (path === '/questions/ask')
      return 'A clear title and reproducible steps get faster, more accurate answers.';
    if (path.startsWith('/questions/'))
      return 'Read the thread, review related topics, and reply with markdown if you can help.';
    if (path === '/rag-documents')
      return 'Private PDF library: reader, semantic search, and AI answers with citations per document.';
    if (path === '/leaderboard')
      return 'Top contributors ranked by votes received this month and all time.';
    if (path.startsWith('/users/') && path.endsWith('/profile'))
      return 'Trust score, badges, and contribution stats for this member.';
    if (path === '/admin')
      return 'Manage the moderation queue, user roles, and flag history.';
    return '';
  };

  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.layout__content}>
        <Navbar
          title={getTitle()}
          subtitle={getSubtitle()}
          user={user}
          onLogout={logout}
          showSearch={location.pathname === '/dashboard'}
          hasUnseenReleases={hasUnseen}
          onBellClick={handleBellClick}
        />
        <main className={styles.layout__main}>
          <div className={styles.layout__mainInner}>
            <Outlet />
          </div>
        </main>

        <footer className={styles.layout__footer}>
          <div className={styles['layout__footer-content']}>
            <div className={styles['layout__footer-branding']}>
              <h4 className={styles['layout__footer-title']}>Evangadi Forum</h4>
              <p className={styles['layout__footer-tagline']}>
                A practice space for technical Q&A, peer feedback, and
                AI-assisted search, built for Evangadi learners and mentors.
              </p>
              <p className={styles['layout__footer-copyright']}>
                © 2026 Evangadi Forum. For educational use.
              </p>
            </div>
            <nav className={styles['layout__footer-nav']}>
              <a href='#' className={styles['layout__footer-link']}>
                About
              </a>
              <a href='#' className={styles['layout__footer-link']}>
                Privacy
              </a>
              <a href='#' className={styles['layout__footer-link']}>
                Terms
              </a>
              <a href='#' className={styles['layout__footer-link']}>
                Contact
              </a>
            </nav>
          </div>
        </footer>
      </div>

      {showModal && (
        <WhatsNewModal releases={releases} onClose={handleCloseModal} />
      )}
    </div>
  );
}
