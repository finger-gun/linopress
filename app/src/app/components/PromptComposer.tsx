import { FormEvent, useCallback, useLayoutEffect, useMemo, useRef } from "react";
import styles from "./PromptComposer.module.css";
import { PromptActions } from "./PromptActions";

type PromptComposerProps = {
  isSubmitting: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  minLines?: number;
  maxLines?: number;
};

const DEFAULT_MIN_LINES = 2;
const DEFAULT_MAX_LINES = 10;

function getLineHeightPx(element: HTMLTextAreaElement): number {
  const computedStyle = window.getComputedStyle(element);
  const parsedLineHeight = Number.parseFloat(computedStyle.lineHeight);

  if (Number.isFinite(parsedLineHeight)) {
    return parsedLineHeight;
  }

  const parsedFontSize = Number.parseFloat(computedStyle.fontSize);
  return Number.isFinite(parsedFontSize) ? parsedFontSize * 1.4 : 22;
}

function getVerticalBoxPx(element: HTMLTextAreaElement): number {
  const computedStyle = window.getComputedStyle(element);

  const paddingTop = Number.parseFloat(computedStyle.paddingTop) || 0;
  const paddingBottom = Number.parseFloat(computedStyle.paddingBottom) || 0;
  const borderTop = Number.parseFloat(computedStyle.borderTopWidth) || 0;
  const borderBottom = Number.parseFloat(computedStyle.borderBottomWidth) || 0;

  return paddingTop + paddingBottom + borderTop + borderBottom;
}

function getVerticalPaddingPx(element: HTMLTextAreaElement): number {
  const computedStyle = window.getComputedStyle(element);
  const paddingTop = Number.parseFloat(computedStyle.paddingTop) || 0;
  const paddingBottom = Number.parseFloat(computedStyle.paddingBottom) || 0;

  return paddingTop + paddingBottom;
}

export function PromptComposer({
  isSubmitting,
  onSubmit,
  minLines = DEFAULT_MIN_LINES,
  maxLines = DEFAULT_MAX_LINES,
}: PromptComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resolvedLineBounds = useMemo(() => {
    const normalizedMin = Math.max(1, Math.floor(minLines));
    const normalizedMax = Math.max(normalizedMin, Math.floor(maxLines));

    return {
      min: normalizedMin,
      max: normalizedMax,
    };
  }, [minLines, maxLines]);

  const resizeTextarea = useCallback(() => {
    const textareaElement = textareaRef.current;

    if (!textareaElement) {
      return;
    }

    const lineHeightPx = getLineHeightPx(textareaElement);
    const verticalBoxPx = getVerticalBoxPx(textareaElement);
    const verticalPaddingPx = getVerticalPaddingPx(textareaElement);

    const minHeightPx = resolvedLineBounds.min * lineHeightPx + verticalBoxPx;
    const maxHeightPx = resolvedLineBounds.max * lineHeightPx + verticalBoxPx;

    textareaElement.style.height = "0px";

    const contentHeightPx = Math.max(0, textareaElement.scrollHeight - verticalPaddingPx) + verticalBoxPx;
    const nextHeightPx = textareaElement.value.length
      ? Math.min(maxHeightPx, Math.max(minHeightPx, contentHeightPx))
      : minHeightPx;

    textareaElement.style.height = `${nextHeightPx}px`;
    textareaElement.style.overflowY = contentHeightPx > maxHeightPx ? "auto" : "hidden";
  }, [resolvedLineBounds.max, resolvedLineBounds.min]);

  useLayoutEffect(() => {
    resizeTextarea();
  }, [resizeTextarea]);

  return (
    <form className={styles.promptPanel} onSubmit={onSubmit}>
      <div className={styles.promptBar} aria-hidden="true">
        <span className={styles.promptUrl}>Describe your website</span>
      </div>

      <div className={styles.promptBody}>
        <textarea
          ref={textareaRef}
          id="site-brief"
          className={styles.promptInput}
          name="site-brief"
          placeholder="Build a premium yoga studio site with classes, memberships, and instructor bios."
          rows={resolvedLineBounds.min}
          onInput={resizeTextarea}
        />

        <PromptActions isSubmitting={isSubmitting} />
      </div>
    </form>
  );
}
