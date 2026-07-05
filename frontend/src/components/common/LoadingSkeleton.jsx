import styles from './LoadingSkeleton.module.css';

/**
 * Generic loading skeleton for pages.
 * Shows a spinner with loading message.
 */
export default function LoadingSkeleton() {
  return (
    <div className={styles.skeleton}>
      <div className={styles.spinner} aria-hidden />
      <p className={styles.text}>Loading…</p>
    </div>
  );
}
