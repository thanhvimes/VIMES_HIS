export type MappingRule = { source: string; target: string; transform?: string; nullable?: boolean; defaultValue?: unknown };

const PATH = /^[A-Za-z_$][A-Za-z0-9_$]*(\.[A-Za-z_$][A-Za-z0-9_$]*|\[\d+\])*$/;
const TRANSFORM = /^(trim|uppercase|lowercase|number|boolean|date:(ISO|dd\/MM\/yyyy)|enum:[A-Za-z0-9_.-]+|default:.+)$/;

export function validateMappingRules(rules: unknown): { valid: boolean; errors: string[]; rules: MappingRule[] } {
  const errors: string[] = [];
  if (!Array.isArray(rules)) return { valid: false, errors: ['mappings must be an array'], rules: [] };
  const normalized: MappingRule[] = [];
  rules.forEach((item, index) => {
    const rule = item as Partial<MappingRule>;
    if (typeof rule.source !== 'string' || !PATH.test(rule.source) || /(^|\.)(__proto__|prototype|constructor)(\.|$)/.test(rule.source)) errors.push(`mappings[${index}].source invalid`);
    if (typeof rule.target !== 'string' || !PATH.test(rule.target) || /(^|\.)(__proto__|prototype|constructor)(\.|$)/.test(rule.target)) errors.push(`mappings[${index}].target invalid`);
    if (rule.transform !== undefined && (typeof rule.transform !== 'string' || !TRANSFORM.test(rule.transform))) errors.push(`mappings[${index}].transform not allowed`);
    if (!errors.some(error => error.startsWith(`mappings[${index}]`))) normalized.push({ source: rule.source!, target: rule.target!, transform: rule.transform, nullable: rule.nullable, defaultValue: rule.defaultValue });
  });
  return { valid: errors.length === 0, errors, rules: normalized };
}
