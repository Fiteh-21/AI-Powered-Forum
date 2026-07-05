/**
 * @file Landing.jsx
 * @description Public marketing route (`/`). Layout and copy align with in-app
 *   shell tokens (cards, borders, slate + orange). No data fetching.
 */
import { useEffect, useRef, useState } from 'react';
import { motion as Motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  MessageSquare,
  Search,
  PenSquare,
  Library,
  ArrowRight,
  CheckCircle2,
  Layers,
  FileText,
  Database,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Landing.module.css';

/**
 * "How it works" steps. Rendered as an interactive stepper: selecting a step
 * chip opens that step's quick guide in the panel below. The 2×2 grid is the
 * default view; clicking a step makes it active, and dismissing returns to the grid.
 */
const HOW_IT_WORKS_STEPS = [
  {
    icon: PenSquare,
    title: 'Ask with context',
    text: 'Title, environment, errors, and what you tried, so peers reproduce before they teach.',
    guide:
      'A good question gets answered faster. Lead with a headline title that names the symptom and stack (e.g. "React 19: state resets after navigation"). In the body, include your environment (OS, browser, versions), numbered steps to reproduce, the exact error text, and a minimal code snippet. Run the AI Draft Coach before posting to tighten it up.',
  },
  {
    icon: MessageSquare,
    title: 'Get answers',
    text: 'Replies live in one thread with markdown and code blocks, visible to everyone in the cohort.',
    guide:
      'Answers appear in a single thread under your question, with full Markdown and fenced code blocks so solutions stay readable. Upvote the responses that helped — it raises the author’s trust score and surfaces the best answer for the next person. Spam or off-topic replies are automatically held for moderator review.',
  },
  {
    icon: Search,
    title: 'Search two ways',
    text: 'Classic text search on the feed, or semantic search when you want “questions like this one.”',
    guide:
      'Two modes share one search bar. Keyword search filters the feed by exact words. AI Search (the Sparkles button) uses embeddings to find questions by meaning — great when you don’t know the exact terms — and returns a written AI answer alongside the matches. Every question page also lists similar questions automatically.',
  },
  {
    icon: Library,
    title: 'Own your trail',
    text: 'Your topics list keeps authorship clear, and the Knowledge base cites your own materials.',
    guide:
      'Your Topics lists every thread you’ve started, so authorship stays clear. Earn a trust score and badges as your answers get upvoted, and climb the monthly and all-time leaderboards. The Knowledge Base lets you upload course PDFs and get answers with citations from your own materials (Course RAG).',
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  // null = original 2×2 grid; a number = that step's detail is open.
  const [activeStep, setActiveStep] = useState(null);
  const stepsRef = useRef(null);
  const sideListRef = useRef(null);
  const detailRef = useRef(null);

  // Clicking outside the steps area returns to the original grid.
  useEffect(() => {
    if (activeStep === null) return undefined;
    const handleOutside = (e) => {
      if (stepsRef.current && !stepsRef.current.contains(e.target)) {
        setActiveStep(null);
      }
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') setActiveStep(null);
    };
    // pointerdown covers mouse, touch and stylus; Escape dismisses for keyboard users.
    document.addEventListener('pointerdown', handleOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('pointerdown', handleOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [activeStep]);

  // Move focus into the opened guide panel so keyboard users don't lose their place
  // when the grid button they activated unmounts.
  useEffect(() => {
    if (activeStep !== null) detailRef.current?.focus();
  }, [activeStep]);

  // Match the detail panel's height to the 3-card stack (side-by-side layout
  // only); a longer guide scrolls inside that height.
  useEffect(() => {
    if (activeStep === null) return undefined;
    const sync = () => {
      const detail = detailRef.current;
      const sideList = sideListRef.current;
      if (!detail || !sideList) return;
      detail.style.height =
        window.innerWidth >= 768 ? `${sideList.offsetHeight}px` : '';
    };
    sync();
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, [activeStep]);

  const scrollToHowItWorks = () => {
    document
      .getElementById('how-it-works')
      ?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToCourseRag = () => {
    document
      .getElementById('course-rag')
      ?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className={styles.landing}>
      <header className={styles.landing__header}>
        <div className={styles.landing__headerInner}>
          <button
            type='button'
            className={styles.landing__brand}
            onClick={() => navigate('/')}
            aria-label='Evangadi Forum home'
          >
            <span className={styles.landing__brandMark} aria-hidden>
              <MessageSquare size={20} strokeWidth={2} />
            </span>
            <span className={styles.landing__brandText}>
              <span className={styles.landing__brandName}>Evangadi Forum</span>
              <span className={styles.landing__brandLine}>
                Learn together. Ask with context.
              </span>
            </span>
          </button>

          <nav className={styles.landing__nav} aria-label='Marketing'>
            <button
              type='button'
              className={styles.landing__navLink}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              Overview
            </button>
            <button
              type='button'
              className={styles.landing__navLink}
              onClick={scrollToCourseRag}
            >
              Course RAG
            </button>

            <button
              type='button'
              className={styles.landing__navLink}
              onClick={scrollToHowItWorks}
            >
              How it works
            </button>
          </nav>

          <div className={styles.landing__headerActions}>
            {isAuthenticated ? (
              <button
                type='button'
                className={styles.landing__btnPrimary}
                onClick={() => navigate('/dashboard')}
              >
                Open forum
                <ArrowRight size={16} aria-hidden />
              </button>
            ) : (
              <>
                <button
                  type='button'
                  className={styles.landing__btnGhost}
                  onClick={() => navigate('/auth')}
                >
                  Sign in
                </button>
                <button
                  type='button'
                  className={styles.landing__btnPrimary}
                  onClick={() => navigate('/auth')}
                >
                  Create account
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className={styles.landing__main}>
        <section className={styles.landing__hero}>
          <div className={styles.landing__heroInner}>
            <div className={styles.landing__heroCopy}>
              <Motion.p
                className={styles.landing__eyebrow}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Sparkles size={14} aria-hidden />
                Keyword search + embedding similarity
              </Motion.p>
              <Motion.h1
                className={styles.landing__title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
              >
                A calm place for{' '}
                <span className={styles.landing__titleAccent}>
                  technical Q&A
                </span>
              </Motion.h1>
              <Motion.p
                className={styles.landing__lead}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                Post with enough context for peers to help in one pass. Search
                the archive by phrase or by meaning, keep your threads in one
                place, and ground questions in{' '}
                <strong className={styles.landing__leadStrong}>
                  course documents
                </strong>{' '}
                with retrieval-augmented generation (RAG) so answers cite the
                right syllabus, readings, and handouts.
              </Motion.p>
              <Motion.div
                className={styles.landing__heroCtas}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <button
                  type='button'
                  className={styles.landing__btnPrimary}
                  onClick={() =>
                    navigate(isAuthenticated ? '/dashboard' : '/auth')
                  }
                >
                  {isAuthenticated ? 'Go to home' : 'Get started'}
                  <ArrowRight size={16} aria-hidden />
                </button>
                {!isAuthenticated && (
                  <button
                    type='button'
                    className={styles.landing__btnOutline}
                    onClick={scrollToHowItWorks}
                  >
                    See how it works
                  </button>
                )}
              </Motion.div>
            </div>

            <aside
              className={styles.landing__heroPanel}
              aria-label='What you get'
            >
              <p className={styles.landing__heroPanelLabel}>At a glance</p>
              <ul className={styles.landing__heroPanelList}>
                <li>
                  <CheckCircle2 size={16} aria-hidden />
                  Markdown threads and replies
                </li>
                <li>
                  <CheckCircle2 size={16} aria-hidden />
                  Semantic search on question embeddings
                </li>
                <li>
                  <CheckCircle2 size={16} aria-hidden />
                  Optional AI draft tips when you ask or answer
                </li>
                <li>
                  <CheckCircle2 size={16} aria-hidden />
                  <span>
                    <strong className={styles.landing__heroPanelStrong}>
                      Course RAG:
                    </strong>{' '}
                    upload or sync course materials, retrieve the best chunks
                    for each question, and answer with citations, not generic
                    web text.
                  </span>
                </li>
              </ul>
            </aside>
          </div>
        </section>

        <section
          className={styles.landing__rag}
          id='course-rag'
          aria-labelledby='rag-heading'
        >
          <div className={styles.landing__sectionInner}>
            <p className={styles.landing__ragEyebrow}>
              Retrieval-augmented generation
            </p>
            <h2 className={styles.landing__sectionTitle} id='rag-heading'>
              How course RAG works with the forum
            </h2>
            <p className={styles.landing__sectionLead}>
              Forum search already helps you find <em>similar questions</em>{' '}
              from peers. RAG goes further: it finds{' '}
              <em>evidence inside your own documents</em> (readings, rubrics,
              lab specs) and surfaces those snippets when you write or review an
              answer. That keeps AI assistance on-policy for Evangadi-style
              courses and reduces “confident but wrong” generic answers.
            </p>
            <div className={styles.landing__ragPipeline}>
              <div className={styles.landing__ragStep}>
                <span className={styles.landing__ragStepIcon} aria-hidden>
                  <FileText size={20} />
                </span>
                <h3 className={styles.landing__ragStepTitle}>Ingest & chunk</h3>
                <p className={styles.landing__ragStepText}>
                  Upload or connect course files; split them into overlapping
                  chunks and store embeddings the same way we already embed
                  questions, so retrieval stays fast and auditable.
                </p>
              </div>
              <div className={styles.landing__ragStep}>
                <span className={styles.landing__ragStepIcon} aria-hidden>
                  <Database size={20} />
                </span>
                <h3 className={styles.landing__ragStepTitle}>
                  Retrieve at question time
                </h3>
                <p className={styles.landing__ragStepText}>
                  When you open Ask or run a search, the app pulls the
                  top-matching chunks from the cohort corpus (with scores), not
                  just other threads. That is ideal for “what does the syllabus
                  say about…” style questions.
                </p>
              </div>
              <div className={styles.landing__ragStep}>
                <span className={styles.landing__ragStepIcon} aria-hidden>
                  <Sparkles size={20} />
                </span>
                <h3 className={styles.landing__ragStepTitle}>
                  Grounded responses
                </h3>
                <p className={styles.landing__ragStepText}>
                  Downstream prompts quote or summarize only from retrieved
                  spans, with room for instructors to review sources. The UI
                  makes it obvious when an answer drew on RAG versus peer
                  replies alone.
                </p>
              </div>
            </div>
            <p className={styles.landing__ragFootnote}>
              Live forum threads, semantic question search, draft/fit AI
              helpers, and this RAG pipeline work together: uploads and access
              control live in the Knowledge base per cohort, and RAG-backed
              context shows up in the same thread view you already use.
            </p>
          </div>
        </section>

        {!isAuthenticated && (
          <>
            <section className={styles.landing__capabilities}>
              <div className={styles.landing__sectionInner}>
                <h2 className={styles.landing__sectionTitle}>
                  Built for cohort coursework
                </h2>
                <p className={styles.landing__sectionLead}>
                  Same patterns you use after sign-in, without a separate
                  “marketing product.”
                </p>
                <div className={styles.landing__cardGrid}>
                  <article className={styles.landing__card}>
                    <div className={styles.landing__cardIcon} aria-hidden>
                      <Search size={22} strokeWidth={1.75} />
                    </div>
                    <h3 className={styles.landing__cardTitle}>
                      Find related work
                    </h3>
                    <p className={styles.landing__cardBody}>
                      Keyword filters for exact matches, plus similarity search
                      when you are still shaping the right vocabulary.
                    </p>
                  </article>
                  <article className={styles.landing__card}>
                    <div className={styles.landing__cardIcon} aria-hidden>
                      <MessageSquare size={22} strokeWidth={1.75} />
                    </div>
                    <h3 className={styles.landing__cardTitle}>
                      Readable threads
                    </h3>
                    <p className={styles.landing__cardBody}>
                      Questions and answers stay structured so the group can
                      reuse explanations before exams and interviews.
                    </p>
                  </article>
                  <article className={styles.landing__card}>
                    <div className={styles.landing__cardIcon} aria-hidden>
                      <Sparkles size={22} strokeWidth={1.75} />
                    </div>
                    <h3 className={styles.landing__cardTitle}>
                      Lightweight AI help
                    </h3>
                    <p className={styles.landing__cardBody}>
                      Suggestions on your question draft and a quick relevance
                      check on answer drafts. Always your choice to apply or
                      post.
                    </p>
                  </article>
                  <article className={`${styles.landing__card} `}>
                    <div className={styles.landing__cardIcon} aria-hidden>
                      <Layers size={22} strokeWidth={1.75} />
                    </div>
                    <h3 className={styles.landing__cardTitle}>
                      RAG over your course library
                    </h3>
                    <p className={styles.landing__cardBody}>
                      Instructors and cohorts add PDFs, syllabi, and notes into
                      a controlled corpus. When you ask, the system retrieves
                      the most relevant passages and attaches them to the
                      prompt, so explanations stay tied to your class materials,
                      not the open web.
                    </p>
                  </article>
                </div>
              </div>
            </section>
          </>
        )}

        <section
          className={styles.landing__process}
          id='how-it-works'
          aria-labelledby='how-heading'
        >
              <div className={styles.landing__sectionInner}>
                <h2 className={styles.landing__sectionTitle} id='how-heading'>
                  How it works
                </h2>
                <p className={styles.landing__sectionLead}>
                  Four steps from question to searchable knowledge for the next
                  person.
                </p>
                <div className={styles.landing__stepsWrap} ref={stepsRef}>
                  {activeStep === null ? (
                    /* Default — original 2×2 grid of cards. */
                    <div className={styles.landing__steps}>
                      {HOW_IT_WORKS_STEPS.map((step, i) => {
                        const StepIcon = step.icon;
                        return (
                          <button
                            key={step.title}
                            type='button'
                            className={styles.landing__step}
                            onClick={() => setActiveStep(i)}
                          >
                            <span className={styles.landing__stepIcon} aria-hidden>
                              <StepIcon size={18} />
                            </span>
                            <span className={styles.landing__stepCopy}>
                              <span className={styles.landing__stepTitle}>
                                {step.title}
                              </span>
                              <span className={styles.landing__stepText}>
                                {step.text}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    /* Open — the other 3 cards stack on the left, the selected
                       step's guide fills the space on the right. */
                    <div className={styles.landing__stepsOpen}>
                      <div className={styles.landing__sideList} ref={sideListRef}>
                        {HOW_IT_WORKS_STEPS.map((step, i) => {
                          if (i === activeStep) return null;
                          const StepIcon = step.icon;
                          return (
                            <button
                              key={step.title}
                              type='button'
                              className={styles.landing__sideCard}
                              onClick={() => setActiveStep(i)}
                            >
                              <span
                                className={styles.landing__stepIcon}
                                aria-hidden
                              >
                                <StepIcon size={16} />
                              </span>
                              <span className={styles.landing__sideTitle}>
                                {step.title}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      <div
                        className={styles.landing__detail}
                        role='region'
                        aria-label={`${HOW_IT_WORKS_STEPS[activeStep].title} — quick guide`}
                        tabIndex={-1}
                        ref={detailRef}
                      >
                        <div className={styles.landing__detailHeader}>
                          <span className={styles.landing__detailIcon} aria-hidden>
                            {(() => {
                              const DetailIcon =
                                HOW_IT_WORKS_STEPS[activeStep].icon;
                              return <DetailIcon size={20} />;
                            })()}
                          </span>
                          <h3 className={styles.landing__detailTitle}>
                            {HOW_IT_WORKS_STEPS[activeStep].title}
                          </h3>
                          <button
                            type='button'
                            className={styles.landing__detailClose}
                            onClick={() => setActiveStep(null)}
                            aria-label='Close'
                          >
                            <X size={18} />
                          </button>
                        </div>
                        <p className={styles.landing__detailGuide}>
                          {HOW_IT_WORKS_STEPS[activeStep].guide}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
        </section>

        {!isAuthenticated && (
          <section className={styles.landing__cta}>
            <div className={styles.landing__ctaInner}>
              <h2 className={styles.landing__ctaTitle}>Ready when you are</h2>
              <p className={styles.landing__ctaText}>
                Create a free learner account to post, reply, and search the
                forum index.
              </p>
              <button
                type='button'
                className={styles.landing__btnPrimary}
                onClick={() => navigate('/auth')}
              >
                Create free account
                <ArrowRight size={16} aria-hidden />
              </button>
            </div>
          </section>
        )}

        {isAuthenticated && (
          <section className={styles.landing__welcomeBack}>
            <div className={styles.landing__sectionInner}>
              <p className={styles.landing__eyebrow}>Signed in</p>
              <h2 className={styles.landing__sectionTitle}>
                Back to your workspace
              </h2>
              <p className={styles.landing__sectionLead}>
                Home has the live feed, shortcuts, and search. Your topics lists
                only threads you started. Course-document RAG (ingest, retrieve,
                cite) ties the Knowledge base to threads. Scroll to{' '}
                <strong>Course RAG</strong> on this page for the full picture.
              </p>
              <button
                type='button'
                className={styles.landing__btnPrimary}
                onClick={() => navigate('/dashboard')}
              >
                Open forum home
                <ArrowRight size={16} aria-hidden />
              </button>
            </div>
          </section>
        )}
      </main>

      <footer className={styles.landing__footer}>
        <div className={styles.landing__footerInner}>
          <div>
            <p className={styles.landing__footerBrand}>Evangadi Forum</p>
            <p className={styles.landing__footerMeta}>
              © {new Date().getFullYear()} · Learner-led Q&A
            </p>
          </div>
          <div className={styles.landing__footerLinks}>
            <button
              type='button'
              className={styles.landing__footerLink}
              onClick={() => navigate('/auth')}
            >
              Sign in
            </button>
            <span className={styles.landing__footerDot} aria-hidden>
              ·
            </span>
            <a href='#' className={styles.landing__footerLinkAnchor}>
              Privacy
            </a>
            <span className={styles.landing__footerDot} aria-hidden>
              ·
            </span>
            <a href='#' className={styles.landing__footerLinkAnchor}>
              Terms
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
