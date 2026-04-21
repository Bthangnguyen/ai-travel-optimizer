// Barrel export + Template Map for Code Generator
export { BigTextReveal } from './BigTextReveal';
export { KeywordCards } from './KeywordCards';
export { SequentialLines } from './SequentialLines';
export { ImpactWord } from './ImpactWord';
export { CounterReveal } from './CounterReveal';
export { TriedItAllList } from './TriedItAllList';
export { DarkBeat } from './DarkBeat';

/**
 * TEMPLATE_MAP: Maps template IDs from video_plan.json to React components.
 * The Code Generator uses this map to resolve template names.
 */
export const TEMPLATE_NAMES = [
  'BigTextReveal',
  'KeywordCards',
  'SequentialLines',
  'ImpactWord',
  'CounterReveal',
  'TriedItAllList',
  'DarkBeat',
] as const;

export type TemplateName = typeof TEMPLATE_NAMES[number];
