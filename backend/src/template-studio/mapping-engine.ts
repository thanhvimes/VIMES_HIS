import { MappingRule, validateMappingRules } from './mapping-validator';

const get = (source: any, path: string) => path.replace(/\[(\d+)\]/g, '.$1').split('.').reduce((value, key) => value == null ? undefined : value[key], source);
const set = (target: any, path: string, value: unknown) => { const keys = path.replace(/\[(\d+)\]/g, '.$1').split('.'); let cursor = target; keys.forEach((key, index) => { if (index === keys.length - 1) cursor[key] = value; else cursor = cursor[key] ??= /^\d+$/.test(keys[index + 1]) ? [] : {}; }); };

function transform(value: unknown, rule: MappingRule): unknown {
  if (value == null) return rule.defaultValue;
  switch (rule.transform) {
    case 'trim': return String(value).trim();
    case 'uppercase': return String(value).toUpperCase();
    case 'lowercase': return String(value).toLowerCase();
    case 'number': return Number(value);
    case 'boolean': return value === true || value === 'true' || value === 1 || value === '1';
    case 'date:dd/MM/yyyy': { const date = new Date(String(value)); return Number.isNaN(date.getTime()) ? value : `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`; }
    case 'date:ISO': { const date = new Date(String(value)); return Number.isNaN(date.getTime()) ? value : date.toISOString(); }
    default: return value;
  }
}

export function applyMapping(rules: unknown, source: Record<string, unknown>): { data: Record<string, unknown>; errors: string[] } {
  const checked = validateMappingRules(rules);
  if (!checked.valid) return { data: {}, errors: checked.errors };
  const data: Record<string, unknown> = {};
  checked.rules.forEach(rule => { const value = get(source, rule.source); if (value !== undefined || rule.defaultValue !== undefined || (value === null && rule.nullable === true)) set(data, rule.target, transform(value, rule)); });
  return { data, errors: [] };
}
