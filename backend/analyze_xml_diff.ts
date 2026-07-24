import fs from 'fs';
import path from 'path';

async function analyze() {
    const pRes = fs.readFileSync(path.join(__dirname, 'xml_output.txt'), 'utf16le');
    const parts = pRes.split('=== DOC 2252 XML FULL ===');
    const pXml = parts[0];
    const dXml = parts[1];

    function getAllLeafNodes(xml: string) {
        const matches = xml.matchAll(/<([A-Z0-9_]+)>([^<]+)<\/\1>/g);
        const map = new Map<string, string>();
        for (const m of matches) {
            map.set(m[1], m[2].trim());
        }
        return map;
    }

    const pLeaves = getAllLeafNodes(pXml);
    const dLeaves = getAllLeafNodes(dXml);

    console.log('=== LEAF TAGS IN 2252 THAT ARE DIFFERENT FROM POSTMAN ===');
    for (const [tag, val] of dLeaves.entries()) {
        const pVal = pLeaves.get(tag);
        if (pVal === undefined) {
            console.log(`+ NEW TAG: <${tag}> = "${val.length > 60 ? val.substring(0, 60) + '...' : val}"`);
        } else if (pVal !== val) {
            console.log(`~ DIFF TAG <${tag}>: 2252="${val}" vs POSTMAN="${pVal}"`);
        }
    }

    console.log('\n=== LEAF TAGS IN POSTMAN THAT ARE MISSING IN 2252 ===');
    for (const [tag, val] of pLeaves.entries()) {
        if (!dLeaves.has(tag)) {
            console.log(`- MISSING IN 2252: <${tag}> = "${val}"`);
        }
    }

    process.exit(0);
}

analyze();
