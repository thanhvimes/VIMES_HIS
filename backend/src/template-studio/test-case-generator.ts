type JsonSchema = { type?: string; properties?: Record<string, JsonSchema>; items?: JsonSchema };

const valueFor = (schema: JsonSchema, mode: string): unknown => {
  if (schema.type === 'object') return Object.fromEntries(Object.entries(schema.properties || {}).map(([key, child]) => [key, valueFor(child, mode)]));
  if (schema.type === 'array') return mode === 'many' ? [valueFor(schema.items || { type: 'string' }, 'normal'), valueFor(schema.items || { type: 'string' }, 'normal')] : mode === 'empty' ? [] : [valueFor(schema.items || { type: 'string' }, mode)];
  if (mode === 'empty') return schema.type === 'string' ? '' : schema.type === 'number' ? 0 : schema.type === 'boolean' ? false : null;
  if (mode === 'long') return schema.type === 'string' ? 'X'.repeat(500) : schema.type === 'number' ? 999999999 : schema.type === 'boolean' ? true : null;
  if (mode === 'boundary') return schema.type === 'number' ? 0 : schema.type === 'string' ? 'A' : schema.type === 'boolean' ? false : null;
  return schema.type === 'number' ? 1 : schema.type === 'boolean' ? true : schema.type === 'string' ? 'Sample' : null;
};

export function generateTestCases(schema: JsonSchema) { return ['NORMAL', 'EMPTY', 'LONG_TEXT', 'BOUNDARY', 'MANY_ROWS'].map(type => ({ name: `Auto ${type}`, testType: type, inputData: valueFor(schema, type === 'MANY_ROWS' ? 'many' : type === 'NORMAL' ? 'normal' : type === 'LONG_TEXT' ? 'long' : type === 'BOUNDARY' ? 'boundary' : 'empty'), isRequired: type === 'NORMAL' })); }
