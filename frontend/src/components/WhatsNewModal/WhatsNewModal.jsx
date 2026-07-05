import { X, Sparkles } from 'lucide-react';
import styles from './WhatsNewModal.module.css';

const CATEGORY_LABELS = {
  new:      'New',
  improved: 'Improved',
  fixed:    'Fixed',
};

const formatDate = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

/**
 * "What's New" changelog modal.
 *
 * Renders one or more releases, each with categorized highlight bullets
 * (New / Improved / Fixed). Closing the modal is the caller's responsibility
 * (it marks the releases as seen).
 *
 * @param {{ releases: Array, onClose: () => void }} props
 */
export default function WhatsNewModal({ releases = [], onClose }) {
  if (!releases.length) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="What's new" onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <Sparkles size={20} className={styles.headerIcon} />
            <h2 className={styles.title}>What&apos;s New</h2>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className={styles.body}>
          {releases.map((release) => (
            <section key={release.releaseId} className={styles.release}>
              <div className={styles.releaseHeader}>
                <h3 className={styles.releaseTitle}>{release.title}</h3>
                <span className={styles.releaseVersion}>v{release.version}</span>
              </div>
              {release.publishedAt && (
                <p className={styles.releaseDate}>{formatDate(release.publishedAt)}</p>
              )}

              <ul className={styles.highlights}>
                {(Array.isArray(release.highlights) ? release.highlights : []).map((h, i) => (
                  <li key={i} className={styles.highlight}>
                    <span className={`${styles.tag} ${styles[`tag--${h.category}`] || ''}`}>
                      {CATEGORY_LABELS[h.category] || h.category}
                    </span>
                    <span className={styles.highlightText}>{h.text}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.gotItBtn} onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
