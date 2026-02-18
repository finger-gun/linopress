import styles from "../page.module.css";

type PromptActionsProps = {
  isSubmitting: boolean;
};

export function PromptActions({ isSubmitting }: PromptActionsProps) {
  return (
    <div className={styles.promptActions}>
      <button type="button" className={styles.attachmentButton} aria-label="Add attachments">
        <span aria-hidden="true">+</span>
      </button>

      <button
        type="submit"
        className={`${styles.submitButton} ${isSubmitting ? styles.submitButtonLoading : ""}`}
        aria-label="Submit prompt"
        aria-busy={isSubmitting}
      >
        <span aria-hidden="true">→</span>
      </button>
    </div>
  );
}
