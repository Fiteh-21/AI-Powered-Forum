import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, MessageSquare, ThumbsUp, Trophy } from 'lucide-react';
import { userService } from '../../services/users/user.service.js';
import styles from './UserProfile.module.css';
import ui from '../../styles/pageStates.module.css';

export default function UserProfile() {
  const { userId } = useParams();
  const navigate   = useNavigate();

  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await userService.getUserProfile(userId);
        if (isMounted) setProfile(data);
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to load profile.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchProfile();
    return () => { isMounted = false; };
  }, [userId]);

  if (isLoading) {
    return (
      <p className={`${ui.pageStates__message} ${ui['pageStates__message--loading']}`}>
        Loading profile...
      </p>
    );
  }

  if (error || !profile) {
    return (
      <div className={`${ui.pageStates__message} ${ui['pageStates__message--error']}`}>
        <p>{error || 'Profile not found.'}</p>
        <button className={styles.backButton} onClick={() => navigate(-1)}>Go back</button>
      </div>
    );
  }

  const joinedYear = profile.joinedAt
    ? new Date(profile.joinedAt).getFullYear()
    : null;

  const displayBadges = (profile.badges || []).filter(b => b.name !== 'Quick Responder Credit');

  return (
    <div className={styles.page}>
      <button className={styles.backButton} onClick={() => navigate(-1)}>
        <ArrowLeft size={14} />
        Back
      </button>

      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.avatar}>
            {profile.firstName?.[0]}{profile.lastName?.[0]}
          </div>
          <div>
            <h1 className={styles.name}>{profile.firstName} {profile.lastName}</h1>
            {joinedYear && <p className={styles.joined}>Member since {joinedYear}</p>}
          </div>
        </div>

        <div className={styles.trustRow}>
          <span className={styles.trustLabel}>Trust score</span>
          <span className={styles.trustValue}>{profile.trustScore ?? 0}</span>
        </div>
      </section>

      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>Stats</h2>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <MessageSquare size={18} className={styles.statIcon} />
            <strong>{profile.stats?.totalAnswers ?? 0}</strong>
            <span>Answers</span>
          </div>
          <div className={styles.stat}>
            <ThumbsUp size={18} className={styles.statIcon} />
            <strong>{profile.stats?.totalVotesReceived ?? 0}</strong>
            <span>Upvotes received</span>
          </div>
          <div className={styles.stat}>
            <Trophy size={18} className={styles.statIcon} />
            <strong>{profile.stats?.monthlyChampionCount ?? 0}</strong>
            <span>Monthly champion</span>
          </div>
        </div>
      </section>

      {displayBadges.length > 0 && (
        <section className={styles.card}>
          <h2 className={styles.sectionTitle}>Badges</h2>
          <div className={styles.badges}>
            {displayBadges.map((b, i) => (
              <span key={i} className={styles.badge}>
                <Star size={11} />
                {b.name}
                {b.earnedAt ? ` · ${new Date(b.earnedAt).toLocaleDateString()}` : ''}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
