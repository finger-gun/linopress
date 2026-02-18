import { FormEvent } from "react";
import styles from "../page.module.css";
import { PromptActions } from "./PromptActions";

type PromptComposerProps = {
  isSubmitting: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function PromptComposer({ isSubmitting, onSubmit }: PromptComposerProps) {
  return (
    <form className={styles.promptPanel} onSubmit={onSubmit}>
      <div className={styles.promptBar} aria-hidden="true">
        <span className={styles.promptUrl}>linopress / site brief</span>
      </div>

      <div className={styles.promptBody}>
        <textarea
          id="site-brief"
          className={styles.promptInput}
          name="site-brief"
          placeholder="Build a premium yoga studio site with classes, memberships, and instructor bios."
        />

        <PromptActions isSubmitting={isSubmitting} />
      </div>
    </form>
  );
}
