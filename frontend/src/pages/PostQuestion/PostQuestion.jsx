import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import MarkdownToolbar from "../../components/common/MarkdownToolbars/MarkdownToolbars.jsx";
import { questionService } from "../../services/question/question.service.js";
import styles from "./PostQuestion.module.css";

/**
 * PostQuestion page – allows authenticated users to draft and submit a forum question.
 * Integrates the AI Draft Coach via `generateQuestionDraftCoach`.
 *
 * Route: /questions/ask
 */
export default function PostQuestion() {
  const navigate = useNavigate();

  /* ── Form state ── */
  const [formData, setFormData] = useState({ title: "", content: "" });
  const [validationErrors, setValidationErrors] = useState({});

  /* ── Async states ── */
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCoaching, setIsCoaching] = useState(false);
  const [error, setError] = useState(null);

  /* ── AI Coach state ── */
  const [coachFeedback, setCoachFeedback] = useState(null);

  /* ── Moderation state ── */
  const [moderationRejection, setModerationRejection] = useState(null); // { reason, guidance }
  const [duplicateWarning, setDuplicateWarning] = useState(null);   // { hash, title } — same user
  const [similarQuestion, setSimilarQuestion]   = useState(null);   // { hash, title } — forum-wide
  const [aiContextResult, setAiContextResult] = useState(null);
  const [isLoadingAiContext, setIsLoadingAiContext] = useState(false);

  /* ── Success state ── */
  const [successData, setSuccessData] = useState(null); // { data, flagged?, moderation? }
  const textareaRef = useRef(null);

  /* ────────────────────────── Helpers ────────────────────────── */

  /** Validate form inputs; returns an errors object (empty = valid). */
  function validate(data) {
    const errors = {};
    if (!data.title || data.title.trim().length < 5) {
      errors.title = "Question title must be at least 5 characters";
    } else if (data.title.length > 255) {
      errors.title = "Question title cannot exceed 255 characters";
    }

    if (!data.content || data.content.trim().length < 10) {
      errors.content = "Question content must be at least 10 characters";
    }
    return errors;
  }

  /* ────────────────────────── Handlers ───────────────────────── */

  /** Track input changes and clear field-specific validation errors. */
  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: undefined }));
    }

    if (coachFeedback) setCoachFeedback(null);
    if (moderationRejection) { setModerationRejection(null); setAiContextResult(null); }
    if (duplicateWarning) setDuplicateWarning(null);
    if (similarQuestion)  setSimilarQuestion(null);
  }

  async function handleGetCoachFeedback() {
    const errors = validate(formData);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsCoaching(true);
    setCoachFeedback(null);
    setError(null);

    try {
      const data = await questionService.generateQuestionDraftCoach(formData);
      setCoachFeedback(data);
    } catch (err) {
      setError(err.message || "Failed to get AI feedback. Please try again.");
    } finally {
      setIsCoaching(false);
    }
  }

  async function handleGetAiContext() {
    setIsLoadingAiContext(true);
    setAiContextResult(null);
    try {
      const answer = await questionService.generateAIContext(formData);
      setAiContextResult(answer || "No result returned. Please try again.");
    } catch {
      setAiContextResult("AI search is temporarily unavailable. Please try again shortly.");
    } finally {
      setIsLoadingAiContext(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // 1. Prevent double submissions if already running
    if (isSubmitting || isCoaching) return;

    // 2. CLEAR THE ERROR NOW so an old AI Coach error doesn't block the post form
    setError(null);

    // 3. Run frontend validation rules
    const errors = validate(formData);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    // 4. Set loading states and submit
    setIsSubmitting(true);

    try {
      const data = await questionService.createQuestion(formData);
      if (!data?.flagged) {
        // Navigate straight to the published question — no blocking success screen.
        const hash = data?.data?.questionHash || data?.questionHash;
        navigate(hash ? `/questions/${hash}` : '/dashboard');
      } else {
        setSuccessData(data);
      }
    } catch (err) {
      if (err.code === 'CONTENT_MODERATION_REJECTED') {
        setModerationRejection({ reason: err.message, guidance: err.guidance });
      } else if (err.code === 'DUPLICATE_QUESTION') {
        setDuplicateWarning({ hash: err.existingQuestionHash, title: err.existingQuestionTitle });
      } else if (err.code === 'SIMILAR_QUESTION_EXISTS') {
        setSimilarQuestion({ hash: err.similarQuestionHash, title: err.similarQuestionTitle });
      } else {
        setError(err.message || "Failed to post question. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleForcePost() {
    setSimilarQuestion(null);
    setIsSubmitting(true);
    try {
      const data = await questionService.createQuestion(formData, { force: true });
      if (!data?.flagged) {
        const hash = data?.data?.questionHash || data?.questionHash;
        navigate(hash ? `/questions/${hash}` : '/dashboard');
      } else {
        setSuccessData(data);
      }
    } catch (err) {
      // force=true only skips the forum-wide similar check; moderation/duplicate
      // errors can still occur, so handle them with the same specialized UX as
      // handleSubmit instead of collapsing everything into a generic banner.
      if (err.code === 'CONTENT_MODERATION_REJECTED') {
        setModerationRejection({ reason: err.message, guidance: err.guidance });
      } else if (err.code === 'DUPLICATE_QUESTION') {
        setDuplicateWarning({ hash: err.existingQuestionHash, title: err.existingQuestionTitle });
      } else if (err.code === 'SIMILAR_QUESTION_EXISTS') {
        setSimilarQuestion({ hash: err.similarQuestionHash, title: err.similarQuestionTitle });
      } else {
        setError(err.message || "Failed to post question. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  /* ────────────────────────── Flagged post review screen ────────── */
  // Only reached when successData.flagged === true.
  // Non-flagged posts navigate directly to the question page.
  if (successData) {
    const modCategory = successData?.moderation?.category;
    const modGuidance = successData?.moderation?.guidance;

    const CATEGORY_LABELS = {
      spam:        'Spam',
      harassment:  'Harassment',
      off_topic:   'Off-topic content',
      low_quality: 'Low quality',
    };

    const handleEditAndResubmit = () => {
      setSuccessData(null);
      setCoachFeedback(null);
      setError(null);
      setModerationRejection(null);
      setValidationErrors({});
    };

    return (
      <div className={styles.page}>
        <div className={styles.pageHeader}>
          <span className={styles.pageLabel}>Ask the cohort</span>
          <h1 className={styles.pageTitle}>Publish to the forum</h1>
        </div>

        <div className={styles.reviewCard}>
          <div className={styles.reviewIcon}>⚠</div>
          <h2 className={styles.reviewTitle}>Your question is under review</h2>
          <p className={styles.reviewSubtitle}>
            Our moderation system flagged this post before it could be published.
            It will not be visible to other users until a moderator approves it.
          </p>

          {modCategory && (
            <div className={styles.reviewDetail}>
              <span className={styles.reviewDetailLabel}>Flagged for</span>
              <span className={styles.reviewDetailValue}>
                {CATEGORY_LABELS[modCategory] || modCategory}
              </span>
            </div>
          )}

          {modGuidance && (
            <p className={styles.reviewGuidance}>{modGuidance}</p>
          )}

          <p className={styles.reviewHint}>
            You can edit your question to address the issue and resubmit, or
            go back to the dashboard.
          </p>

          <div className={styles.reviewActions}>
            <button className={styles.reviewEditBtn} onClick={handleEditAndResubmit}>
              Edit and resubmit
            </button>
            <button className={styles.successBackBtn} onClick={() => navigate("/dashboard")}>
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ────────────────────────── Main form ──────────────────────── */
  return (
    <div className={styles.page}>
      {/* Page header */}
      <div className={styles.pageHeader}>
        <span className={styles.pageLabel}>Ask the cohort</span>
        <h1 className={styles.pageTitle}>Publish to the forum</h1>
        <p className={styles.pageSubtitle}>
          Public threads help the whole cohort. Write as if a classmate will
          debug your issue tomorrow. They only know what you put on the page.
        </p>
      </div>

      {/* Guidelines card */}
      <div className={styles.guidelines}>
        <h2 className={styles.guidelinesTitle}>
          Write questions people can answer in one pass
        </h2>
        <p className={styles.guidelinesIntro}>
          Mentors volunteer their time. Give them runnable context, expected vs
          actual behavior, and a tight scope so they can reproduce the issue
          without guessing your setup.
        </p>

        <div className={styles.guidelinesSection}>
          <h3 className={styles.guidelinesSectionTitle}>
            Checklist before you post
          </h3>
          <ul className={styles.guidelinesList}>
            <li>
              <strong>Title as a headline</strong> that states the symptom and
              tech stack (e.g., "React 19: state resets after navigation").
            </li>
            <li>
              <strong>Repro steps</strong> numbered, with environment (OS,
              browser, Node version) when it matters.
            </li>
            <li>
              <strong>Minimal code</strong> in fenced markdown blocks; trim
              unrelated lines so readers scan faster.
            </li>
            <li>
              <strong>Exact errors</strong> copied verbatim, including stack
              trace snippets when debugging backend routes.
            </li>
          </ul>
        </div>

        <div className={styles.guidelinesSection}>
          <h3 className={styles.guidelinesSectionTitle}>
            Validation rules (enforced by the form)
          </h3>
          <ul className={styles.guidelinesList}>
            <li>
              <strong>Title length:</strong> Must be between 5 and 255
              characters.
            </li>
            <li>
              <strong>Body length:</strong> Must contain a minimum of 10
              characters detailing your problem.
            </li>
            <li>
              <strong>Single topic:</strong> Split unrelated bugs into separate
              threads so search and embeddings stay precise.
            </li>
          </ul>
        </div>
      </div>

      {/* General error banner */}
      {error && (
        <div id="post-question-error" className={styles.errorBanner} role="alert">
          {error}
        </div>
      )}

      {/* Moderation rejection banner — off-topic / out of scope */}
      {moderationRejection && (
        <div className={styles.moderationBanner} role="alert">
          <strong>Your question was not published.</strong> {moderationRejection.reason}
          {moderationRejection.guidance && (
            <p className={styles.moderationGuidance}>{moderationRejection.guidance}</p>
          )}
          <div className={styles.moderationActions}>
            <button
              type="button"
              className={styles.aiSearchBtn}
              onClick={handleGetAiContext}
              disabled={isLoadingAiContext}
            >
              {isLoadingAiContext ? (
                <><span className={`${styles.spinner} ${styles.spinnerDark}`} /> Searching…</>
              ) : (
                <><span className={styles.aiCoachBtnIcon}>✦</span> Get AI answer on this topic</>
              )}
            </button>
          </div>
          {aiContextResult && (
            <div className={styles.aiContextPanel}>
              <div className={styles.aiContextHeader}>
                <span className={styles.aiCoachBtnIcon}>✦</span> AI Answer
              </div>
              <p className={styles.aiContextText}>{aiContextResult}</p>
            </div>
          )}
        </div>
      )}

      {/* Forum-wide similar question suggestion */}
      {similarQuestion && (
        <div className={styles.similarBanner} role="alert">
          <strong>A very similar question already exists in the forum.</strong>
          {similarQuestion.title && (
            <p className={styles.similarTitle}>"{similarQuestion.title}"</p>
          )}
          <p className={styles.similarSubtext}>
            Reading it may already answer your question. If your situation is different, you can still post.
          </p>
          <div className={styles.similarActions}>
            {similarQuestion.hash && (
              <button
                type="button"
                className={styles.similarViewBtn}
                onClick={() => navigate(`/questions/${similarQuestion.hash}`)}
              >
                View existing question →
              </button>
            )}
            <button
              type="button"
              className={styles.similarForceBtn}
              onClick={handleForcePost}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Posting…' : 'Post anyway'}
            </button>
          </div>
        </div>
      )}

      {/* Duplicate question warning */}
      {duplicateWarning && (
        <div className={styles.duplicateBanner} role="alert">
          <strong>You already have a very similar question posted.</strong>{' '}
          Posting the same question again won't get faster answers.
          {duplicateWarning.hash && (
            <div className={styles.moderationActions}>
              <button
                type="button"
                className={styles.duplicateViewBtn}
                onClick={() => navigate(`/questions/${duplicateWarning.hash}`)}
              >
                View your existing question →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Form card */}
      <form
        id="post-question-form"
        className={styles.formCard}
        onSubmit={handleSubmit}
        noValidate
      >
        {/* Title field */}
        <div className={styles.field}>
          <label htmlFor="question-title" className={styles.fieldLabel}>
            Title
          </label>
          <p className={styles.fieldHint}>
            Be specific and imagine you&apos;re asking a question to another
            person.
          </p>
          <input
            id="question-title"
            name="title"
            type="text"
            className={`${styles.titleInput}${validationErrors.title ? ` ${styles.inputError}` : ""}`}
            placeholder="e.g. How do I handle state management using Context API in React?"
            value={formData.title}
            onChange={handleChange}
            disabled={isSubmitting}
            maxLength={255}
          />
          {validationErrors.title && (
            <span className={styles.fieldError} role="alert">
              {validationErrors.title}
            </span>
          )}
        </div>

        {/* Content field */}
        <div className={styles.field}>
          <label htmlFor="question-content" className={styles.fieldLabel}>
            What are the details of your problem?
          </label>
          <p className={styles.fieldHint}>
            Introduce the problem and expand on what you put in the title.
            Minimum 10 characters.
          </p>

          <MarkdownToolbar
            textareaRef={textareaRef}
            value={formData.content}
            onChange={(newValue) =>
              setFormData((prev) => ({ ...prev, content: newValue }))
            }
            disabled={isSubmitting}
            hasError={Boolean(validationErrors.content)}
          >
            <textarea
              id="question-content"
              name="content"
              ref={textareaRef}
              className={styles.contentTextarea}
              placeholder="Include all the information someone would need to answer your question... Use Markdown like **bold**, _italic_, `code`, [link](url)"
              value={formData.content}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </MarkdownToolbar>
          {validationErrors.content && (
            <span className={styles.fieldError} role="alert">
              {validationErrors.content}
            </span>
          )}
        </div>

        {/* AI Coach row */}
        <div>
          <div className={styles.aiCoachRow}>
            <button
              id="ai-suggestions-btn"
              type="button"
              className={styles.aiCoachBtn}
              onClick={handleGetCoachFeedback}
              disabled={isCoaching || isSubmitting}
            >
              {isCoaching ? (
                <>
                  <span className={`${styles.spinner} ${styles.spinnerDark}`} />
                  Analyzing…
                </>
              ) : (
                <>
                  <span className={styles.aiCoachBtnIcon}>✦</span>
                  AI suggestions
                </>
              )}
            </button>
            <span className={styles.aiCoachHint}>
              Suggestions only. You still choose what to post.
            </span>
          </div>

          {/* AI Feedback panel */}
          {coachFeedback && (
            <div id="ai-coach-panel" className={styles.coachPanel}>
              <div className={styles.coachPanelHeader}>
                <span className={styles.coachPanelIcon}>✦</span>
                AI Draft Coach
              </div>
              {coachFeedback.feedback && (
                <p className={styles.coachFeedbackText}>
                  {coachFeedback.feedback}
                </p>
              )}
              {Array.isArray(coachFeedback.tips) &&
                coachFeedback.tips.length > 0 && (
                  <ul className={styles.coachSuggestionsList}>
                    {coachFeedback.tips.map((tip, i) => (
                      <li key={i} className={styles.coachSuggestionItem}>
                        {tip}
                      </li>
                    ))}
                  </ul>
                )}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className={styles.formActions}>
          <button
            id="cancel-question-btn"
            type="button"
            className={styles.cancelBtn}
            onClick={() => navigate(-1)}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            id="submit-question-btn"
            type="submit"
            className={styles.submitBtn}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className={styles.spinner} />
                Posting…
              </>
            ) : (
              <>
                Post Question
                <span>↗</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
