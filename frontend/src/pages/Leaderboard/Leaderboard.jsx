import { useEffect, useState } from 'react';
import { Trophy, Star, Medal } from 'lucide-react';
import { leaderboardService } from '../../services/leaderboard/leaderboard.service.js';
import styles from './Leaderboard.module.css';
import ui from '../../styles/pageStates.module.css';

const TABS = [
  { key: 'monthly', label: 'This Month' },
  { key: 'alltime', label: 'All Time' },
];

const RANK_ICONS = [
  <Trophy key={1} size={18} className={styles['rank--gold']} />,
  <Medal  key={2} size={18} className={styles['rank--silver']} />,
  <Medal  key={3} size={18} className={styles['rank--bronze']} />,
];

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState('monthly');
  const [monthly, setMonthly]     = useState(null);
  const [alltime, setAlltime]     = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchBoth = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [m, a] = await Promise.all([
          leaderboardService.getMonthlyLeaderboard(),
          leaderboardService.getAllTimeLeaderboard(),
        ]);
        if (!isMounted) return;
        setMonthly(m);
        setAlltime(a);
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to load leaderboard.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchBoth();
    return () => { isMounted = false; };
  }, []);

  const entries = activeTab === 'monthly'
    ? (monthly?.data ?? [])
    : (alltime?.data ?? []);

  const periodLabel = activeTab === 'monthly' && monthly?.period
    ? (() => {
        const [year, month] = monthly.period.split('-');
        return new Date(year, Number(month) - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
      })()
    : null;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.tabs}>
          {TABS.map(tab => (
            <button
              key={tab.key}
              type="button"
              className={`${styles.tab} ${activeTab === tab.key ? styles['tab--active'] : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {periodLabel && <p className={styles.period}>{periodLabel}</p>}
      </div>

      {isLoading && (
        <p className={`${ui.pageStates__message} ${ui['pageStates__message--loading']}`}>
          Loading leaderboard...
        </p>
      )}

      {!isLoading && error && (
        <p className={`${ui.pageStates__message} ${ui['pageStates__message--error']}`}>{error}</p>
      )}

      {!isLoading && !error && entries.length === 0 && (
        <div className={`${ui.pageStates__message} ${ui['pageStates__message--empty']}`}>
          No activity yet for this period. Start answering questions to appear here!
        </div>
      )}

      {!isLoading && !error && entries.length > 0 && (
        <div className={styles.podium}>
          {entries.map((entry, index) => (
            <article key={entry.userId} className={`${styles.card} ${styles[`card--rank${index + 1}`]}`}>
              <div className={styles.rankIcon}>{RANK_ICONS[index]}</div>
              <div className={styles.avatar}>
                {entry.firstName?.[0]}{entry.lastName?.[0]}
              </div>
              <div className={styles.info}>
                <p className={styles.name}>{entry.firstName} {entry.lastName}</p>
                <p className={styles.score}>
                  {activeTab === 'monthly'
                    ? `${entry.pointsThisPeriod} pts · ${entry.answerCount} answers`
                    : `${entry.pointsThisPeriod} trust score`}
                </p>
              </div>
              {entry.badges?.length > 0 && (
                <div className={styles.badges}>
                  {entry.badges.map(badge => (
                    <span key={badge} className={styles.badge}>
                      <Star size={10} />
                      {badge}
                    </span>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
