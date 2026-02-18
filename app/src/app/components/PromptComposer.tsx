import {
  FormEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import styles from "./PromptComposer.module.css";
import { PromptActions } from "./PromptActions";
import { analyzePromptTip, promptTipDefaults } from "./promptTipAnalyzer";

type PromptComposerProps = {
  isSubmitting: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  minLines?: number;
  maxLines?: number;
};

const DEFAULT_MIN_LINES = 2;
const DEFAULT_MAX_LINES = 10;
const INITIAL_TIP_DELAY_MS = 1000;
const TIP_DEBOUNCE_MS = 320;
const TIP_MIN_DWELL_MS = 1800;
const TIP_MIN_CONFIDENCE = 0.5;

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
  const [promptText, setPromptText] = useState("");
  const [hasStartedTyping, setHasStartedTyping] = useState(false);
  const [activeTip, setActiveTip] = useState(promptTipDefaults.defaultTip);
  const [activeSince, setActiveSince] = useState<number>(0);
  const [recentTipIds, setRecentTipIds] = useState<string[]>([]);

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

  useEffect(() => {
    if (hasStartedTyping || promptText.trim().length === 0) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setHasStartedTyping(true);
    }, INITIAL_TIP_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [hasStartedTyping, promptText]);

  useEffect(() => {
    const textareaElement = textareaRef.current;

    if (!textareaElement) {
      return;
    }

    const evaluateTip = () => {
      const now = Date.now();
      const dwellElapsed = now - activeSince;
      const excludedTipIds = new Set(recentTipIds.slice(-2));

      const analysis = analyzePromptTip({
        text: promptText,
        excludedTipIds,
      });

      const candidateTip =
        analysis.confidence < TIP_MIN_CONFIDENCE
          ? promptTipDefaults.defaultTip
          : analysis.tip;

      if (candidateTip.id === activeTip.id) {
        return;
      }

      if (dwellElapsed < TIP_MIN_DWELL_MS && candidateTip.priority <= activeTip.priority) {
        return;
      }

      setActiveTip(candidateTip);
      setActiveSince(now);
      setRecentTipIds((previous) => {
        const next = [...previous, candidateTip.id];
        return next.slice(-5);
      });
    };

    const timeoutId = window.setTimeout(evaluateTip, TIP_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [activeSince, activeTip.id, activeTip.priority, promptText, recentTipIds]);

  const handleInput = () => {
    resizeTextarea();

    if (textareaRef.current) {
      const nextValue = textareaRef.current.value;
      setPromptText(nextValue);
    }
  };

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
          onInput={handleInput}
        />

        <p
          className={`${styles.contextualTip} ${
            hasStartedTyping ? styles.contextualTipVisible : styles.contextualTipHidden
          }`}
          role="status"
          aria-live="polite"
          aria-hidden={!hasStartedTyping}
        >
          {activeTip.text}
        </p>

        <PromptActions isSubmitting={isSubmitting} />
      </div>
    </form>
  );
}
