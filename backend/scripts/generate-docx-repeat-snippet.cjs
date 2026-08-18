const name = process.argv[2];
if (!name || !/^[A-Za-z][A-Za-z0-9_]*$/.test(name)) {
  console.error('Usage: node generate-docx-repeat-snippet.cjs <arrayField>'); process.exit(2);
}
const label = process.argv[3] || name;
console.log(JSON.stringify({ field: name, label, docx: `{d.${name}.i}` , row: `{d.${name}.field}`, end: `{d.${name}.length}` , example: { [name]: [{ field: 'value' }] } }, null, 2));
