export type PromptTip = {
  id: string;
  text: string;
  priority: number;
};

type SlotRule = {
  id: string;
  tip: string;
  priority: number;
  patterns: RegExp[];
};

type AnalyzePromptInput = {
  text: string;
  excludedTipIds?: ReadonlySet<string>;
};

type AnalyzePromptResult = {
  tip: PromptTip;
  confidence: number;
};

const DEFAULT_TIP: PromptTip = {
  id: "tip-default",
  text: "Start with what kind of website you want, who it is for, and your main goal.",
  priority: 0,
};

const SLOT_RULES: SlotRule[] = [
  {
    id: "tip-business-type",
    tip: "Add what type of business or site this is (e.g. yoga studio, portfolio, restaurant).",
    priority: 10,
    patterns: [
      /\b(studio|agency|restaurant|cafe|shop|store|portfolio|blog|saas|clinic|coach|consulting|nonprofit|e-?commerce)\b/i,
      /\bwebsite for\b/i,
    ],
  },
  {
    id: "tip-audience",
    tip: "Mention your target audience so tone and structure can be tailored.",
    priority: 9,
    patterns: [/\bfor\s+(beginners|professionals|families|students|small businesses|founders|parents|developers)\b/i, /\btarget audience\b/i],
  },
  {
    id: "tip-goal",
    tip: "Describe the main goal of the site (bookings, leads, sales, newsletter signups).",
    priority: 8,
    patterns: [
      /\b(goal|objective|purpose)\b/i,
      /\b(bookings?|appointments?|leads?|sales|conversions?|signups?|subscribers?)\b/i,
    ],
  },
  {
    id: "tip-sections",
    tip: "List key pages or sections you want (home, about, services, pricing, contact).",
    priority: 7,
    patterns: [/\b(home|about|services?|pricing|contact|faq|testimonials?|blog|gallery|menu|team)\b/i, /\bpages?\b/i],
  },
  {
    id: "tip-style",
    tip: "Add visual direction (minimal, premium, playful, modern) and any color or mood preferences.",
    priority: 6,
    patterns: [
      /\b(minimal|premium|playful|modern|bold|elegant|clean|dark|light|color palette|colors?)\b/i,
      /\bstyle\b/i,
    ],
  },
  {
    id: "tip-cta",
    tip: "Specify the main call-to-action users should take on the site.",
    priority: 5,
    patterns: [/\b(call to action|cta)\b/i, /\b(book now|contact us|get started|join now|request a quote)\b/i],
  },
];

function computeConfidence(text: string): number {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

  if (!wordCount) {
    return 0;
  }

  if (wordCount < 6) {
    return 0.45;
  }

  if (wordCount < 14) {
    return 0.7;
  }

  return 0.85;
}

export function analyzePromptTip({ text, excludedTipIds }: AnalyzePromptInput): AnalyzePromptResult {
  const trimmedText = text.trim();

  if (!trimmedText) {
    return {
      tip: DEFAULT_TIP,
      confidence: 0,
    };
  }

  const missingRules = SLOT_RULES.filter(
    (rule) => !rule.patterns.some((pattern) => pattern.test(trimmedText)),
  );

  const sortedRules = [...missingRules].sort((left, right) => right.priority - left.priority);

  const bestRule =
    sortedRules.find((rule) => !excludedTipIds?.has(rule.id)) ??
    sortedRules[0];

  if (!bestRule) {
    return {
      tip: {
        id: "tip-refine",
        text: "Nice brief. Add any must-have details like preferred tone, constraints, or launch priorities.",
        priority: 1,
      },
      confidence: computeConfidence(trimmedText),
    };
  }

  return {
    tip: {
      id: bestRule.id,
      text: bestRule.tip,
      priority: bestRule.priority,
    },
    confidence: computeConfidence(trimmedText),
  };
}

export const promptTipDefaults = {
  defaultTip: DEFAULT_TIP,
};
