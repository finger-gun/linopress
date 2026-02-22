import { assertSiteId } from '../stack/provision.js';
import { assertStackExists, listStacks } from '../stack/compose.js';

type SiteSelectionOptions = {
  commandLabel?: string;
};

const formatMultipleStacksError = (stacks: string[], commandLabel?: string) => {
  const suffix = commandLabel ? ` for ${commandLabel}` : '';
  return `Multiple stacks found (${stacks.join(', ')}). Provide --site <id>${suffix} to select a target.`;
};

export const selectSiteIdFromStacks = (
  requested: string | undefined,
  stacks: string[],
  options: SiteSelectionOptions = {},
) => {
  if (requested) return requested;
  if (stacks.length === 1) return stacks[0];
  if (stacks.length === 0) {
    throw new Error('No stacks found. Provide --site or run linopress provision/build first.');
  }
  throw new Error(formatMultipleStacksError(stacks, options.commandLabel));
};

export const resolveSiteId = async (
  requested: string | undefined,
  options: SiteSelectionOptions = {},
) => {
  if (requested) {
    assertSiteId(requested);
    await assertStackExists(requested);
    return requested;
  }

  const stacks = await listStacks();
  return selectSiteIdFromStacks(undefined, stacks, options);
};
