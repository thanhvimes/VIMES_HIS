import { validateMappingRules, MappingRule } from './mapping-validator';

export type MappingStatus = 'DRAFT' | 'PUBLISHED' | 'RETIRED';
export type MappingRecord = { code: string; moduleCode: string; contractCode: string; version: number; status: MappingStatus; mappings: MappingRule[]; createdBy: string };

export function createMapping(input: { code: string; moduleCode: string; contractCode: string; mappings: unknown; createdBy: string }): MappingRecord {
  if (!/^[A-Z0-9_]+$/.test(input.code)) throw Object.assign(new Error('Invalid mapping code'), { status: 400 });
  const checked = validateMappingRules(input.mappings);
  if (!checked.valid) throw Object.assign(new Error(checked.errors.join('; ')), { status: 400 });
  return { code: input.code, moduleCode: input.moduleCode, contractCode: input.contractCode, version: 1, status: 'DRAFT', mappings: checked.rules, createdBy: input.createdBy };
}

export function createMappingVersion(previous: MappingRecord, mappings: unknown, createdBy: string): MappingRecord {
  if (previous.status === 'DRAFT') throw Object.assign(new Error('Publish or edit the existing draft before creating a version'), { status: 409 });
  const checked = validateMappingRules(mappings);
  if (!checked.valid) throw Object.assign(new Error(checked.errors.join('; ')), { status: 400 });
  return { ...previous, version: previous.version + 1, status: 'DRAFT', mappings: checked.rules, createdBy };
}

export function transitionMapping(record: MappingRecord, action: 'publish' | 'retire'): MappingRecord {
  if (action === 'publish' && record.status !== 'DRAFT') throw Object.assign(new Error('Only DRAFT mapping can be published'), { status: 409 });
  if (action === 'retire' && record.status !== 'PUBLISHED') throw Object.assign(new Error('Only PUBLISHED mapping can be retired'), { status: 409 });
  return { ...record, status: action === 'publish' ? 'PUBLISHED' : 'RETIRED' };
}
