import type { BusinessInfo, SiteSpec } from '../models/types.js';

export type TemplateVariables = Record<string, string>;

export const DEFAULT_TEMPLATE_VARIABLES: TemplateVariables = {
  CTA_TEXT: 'Get Started',
  SERVICES_INTRO: 'Explore our offerings tailored to your needs.',
  SERVICE_1: 'Personalized sessions',
  SERVICE_2: 'Group classes',
  SERVICE_3: 'Workshops and events',
  ABOUT_STORY: 'A short story about how the business began.',
  PLAN_1_NAME: 'Starter',
  PLAN_1_PRICE: '$49 / month',
  PLAN_1_FEATURE_1: 'Weekly access',
  PLAN_1_FEATURE_2: 'Community support',
  PLAN_1_FEATURE_3: 'Flexible scheduling',
  PLAN_2_NAME: 'Premium',
  PLAN_2_PRICE: '$89 / month',
  PLAN_2_FEATURE_1: 'Unlimited access',
  PLAN_2_FEATURE_2: 'Priority booking',
  PLAN_2_FEATURE_3: 'Member events',
  FAQ_Q1: 'What should I bring?',
  FAQ_A1: 'Bring comfortable clothing and a water bottle.',
  FAQ_Q2: 'Do I need experience?',
  FAQ_A2: 'All levels are welcome.',
  TESTIMONIAL_1: 'This was the best experience I have had in years.',
  TESTIMONIAL_AUTHOR_1: 'Alex R.',
  TESTIMONIAL_2: 'A calm, professional team that truly cares.',
  TESTIMONIAL_AUTHOR_2: 'Jordan K.',
  CONTACT_FORM: '[contact-form-7 id="1"]',
};

const normalizeBusiness = (business?: BusinessInfo) => ({
  name: business?.name ?? '',
  tagline: business?.tagline ?? '',
  description: business?.description ?? '',
  phone: business?.phone ?? '',
  email: business?.email ?? '',
  address: business?.address ?? '',
  hours: business?.hours ?? '',
});

export const buildTemplateVariables = (
  siteSpec: SiteSpec,
  overrides?: TemplateVariables,
): TemplateVariables => {
  const business = normalizeBusiness(siteSpec.business);
  return {
    BUSINESS_NAME: business.name,
    TAGLINE: business.tagline,
    BUSINESS_DESCRIPTION: business.description,
    PHONE: business.phone,
    EMAIL: business.email,
    ADDRESS: business.address,
    HOURS: business.hours,
    ...DEFAULT_TEMPLATE_VARIABLES,
    ...(overrides ?? {}),
  };
};

export const substituteTemplateVariables = (
  template: string,
  variables: TemplateVariables,
): { content: string; missing: string[] } => {
  const missing = new Set<string>();
  const content = template.replace(/\[([A-Z0-9_]+)\]/g, (match, key) => {
    if (variables[key] !== undefined) {
      return variables[key];
    }
    missing.add(key);
    return match;
  });
  return { content, missing: Array.from(missing) };
};
