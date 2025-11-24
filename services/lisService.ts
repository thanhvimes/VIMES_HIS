
import { LisLogEntry, LisResultData, LisMachineType } from '../types';

// --- CONSTANTS (ASCII Control Characters) ---
const STX = '\x02';
const ETX = '\x03';
const EOT = '\x04';
const ENQ = '\x05';
const ACK = '\x06';
const NAK = '\x15';
const CR = '\r';
const LF = '\n';

// --- TYPES FOR PARSED OUPUT ---
export interface ParsedSample {
    sampleId: string;
    patientName?: string;
    results: LisResultData[];
    rawMessage: string;
    protocol: string;
}

export const lisService = {
    
    // --- 1. PUBLIC API: RECEIVE & PROCESS ---

    /**
     * Main entry point to process incoming data stream from Machine
     * This function orchestrates Parsing -> Saving to DB
     */
    processMessage: async (protocol: string, rawMessage: string): Promise<{ log: LisLogEntry, parsed?: ParsedSample }> => {
        const now = new Date();
        const timeStr = now.toLocaleTimeString();
        
        let parsedData: ParsedSample | null = null;

        // 1. Identify Protocol & Parse
        try {
            if (protocol === 'HL7') {
                parsedData = lisService.parseHL7(rawMessage);
            } else if (protocol === 'ASTM' || protocol === 'Serial') {
                parsedData = lisService.parseASTM(rawMessage);
            }
        } catch (e) {
            console.error("Parsing Error:", e);
        }

        // 2. If parsed successfully, simulate saving to HIS Database (API Call)
        if (parsedData && parsedData.results.length > 0) {
            await lisService.saveResultsToHIS(parsedData);
        }

        // 3. Return Log Entry for UI
        return {
            log: {
                id: Date.now().toString(),
                timestamp: timeStr,
                direction: 'IN',
                message: rawMessage,
                type: 'DATA', // Assuming data frame
                parsedData: parsedData?.results // Attach results for UI preview
            },
            parsed: parsedData || undefined
        };
    },

    // --- 2. PARSING ENGINES ---

    /**
     * Parse HL7 (Health Level 7) Messages
     * Focus on PID (Patient), OBR (Order), and OBX (Results) segments
     */
    parseHL7: (rawMessage: string): ParsedSample => {
        const segments = rawMessage.split(CR).map(s => s.trim()).filter(s => s !== '');
        
        let sampleId = 'UNKNOWN';
        let patientName = '';
        const results: LisResultData[] = [];

        segments.forEach(segment => {
            const fields = segment.split('|');
            const segmentType = fields[0];

            // Parse Sample ID from OBR (Observation Request) - usually OBR-2 or OBR-3
            if (segmentType === 'OBR') {
                // OBR|1|SID1234|...
                sampleId = fields[2] || fields[3] || 'UNKNOWN'; 
            }

            // Parse Patient Name from PID
            if (segmentType === 'PID') {
                // PID|1|||Nguyen Van A||...
                patientName = fields[5] ? fields[5].replace('^', ' ') : '';
            }

            // Parse Results from OBX
            if (segmentType === 'OBX') {
                // Example: OBX|1|NM|WBC^White Blood Cell||7.5|10*9/L|4.0-10.0|N|||F
                // OBX-3: Test Code (Identifier)
                // OBX-5: Result Value
                // OBX-6: Units
                // OBX-7: Reference Range
                // OBX-8: Abnormal Flag (H, L, N)

                const testIdPart = fields[3] || '';
                // Handle cases where test code is "WBC^White Blood Cell" -> extract "WBC"
                const testCode = testIdPart.split('^')[0];
                
                const value = fields[5] || '';
                const unit = fields[6] || '';
                const refRange = fields[7] || '';
                const flag = fields[8] || 'N';

                if (testCode && value) {
                    results.push({
                        testCode: testCode,
                        value: value,
                        unit: unit.replace('^', ''),
                        refRange: refRange,
                        flag: flag
                    });
                }
            }
        });

        return {
            sampleId,
            patientName,
            results,
            rawMessage,
            protocol: 'HL7'
        };
    },

    /**
     * Parse ASTM (E1381/E1394) Messages
     * Frame based: H (Header), P (Patient), O (Order), R (Result), L (Terminator)
     */
    parseASTM: (rawMessage: string): ParsedSample => {
        // Normalize line endings (ASTM usually uses CR+LF or just CR)
        const lines = rawMessage.split(/[\r\n]+/).filter(l => l.trim() !== '');
        
        let sampleId = 'UNKNOWN';
        let patientName = '';
        const results: LisResultData[] = [];

        lines.forEach(line => {
            // Remove framing characters (STX, ETX, Frame Number) if present
            // Simple regex to extract content between potential frame numbers and CR/LF
            // Real world: needs checksum validation handling. Here we strip control chars.
            const cleanLine = line.replace(/[\x02\x03\x04\x05]/g, '');
            
            // ASTM records usually start with Record Type ID (H, P, O, R, L, C)
            // We look for the pipe '|' delimiter logic.
            // Note: Sometimes the first char is the frame number (e.g. "1H|..."), we need to handle that.
            
            const recordTypeChar = cleanLine.replace(/^[0-9]/, '').charAt(0); // Get first non-digit char
            
            // Extract fields. Note: ASTM delimiters can be configured in Header, but | is standard.
            const fields = cleanLine.substring(cleanLine.indexOf(recordTypeChar)).split('|');

            if (recordTypeChar === 'P') {
                // P|1|||Patient Name||...
                // Field 5 usually Name
                patientName = fields[5] ? fields[5].replace('^', ' ') : '';
            }

            if (recordTypeChar === 'O') {
                // O|1|SID1234||...
                // Field 2 or 3 is Sample ID
                sampleId = fields[2] || 'UNKNOWN';
            }

            if (recordTypeChar === 'R') {
                // R|1|^^^WBC|7.5|10*9/L|4.0-10.0|N||F
                // Field 2: Universal Test ID (^^^Code)
                // Field 3: Data Value
                // Field 4: Units
                // Field 5: Reference Range
                // Field 6: Result Flag
                
                const testPart = fields[2] || '';
                const testCode = testPart.replace(/\^/g, ''); // Remove ^^^
                
                const value = fields[3] || '';
                const unit = fields[4] || '';
                const refRange = fields[5] || '';
                const flag = fields[6] || 'N';

                if (testCode && value) {
                    results.push({
                        testCode: testCode,
                        value: value,
                        unit: unit,
                        refRange: refRange,
                        flag: flag
                    });
                }
            }
        });

        return {
            sampleId,
            patientName,
            results,
            rawMessage,
            protocol: 'ASTM'
        };
    },

    // --- 3. API SIMULATION (The "Backend" Logic) ---

    /**
     * Simulate sending parsed results to the HIS/EMR Backend
     */
    saveResultsToHIS: async (data: ParsedSample): Promise<boolean> => {
        console.log(">>> [MOCK API CALL] Sending LIS Results to HIS Database...");
        console.log(`    SampleID: ${data.sampleId}`);
        console.log(`    Items: ${data.results.length}`);
        
        // Mock API payload structure
        const payload = {
            endpoint: '/api/lis/results/update',
            method: 'POST',
            body: {
                sid: data.sampleId,
                machine_protocol: data.protocol,
                results: data.results.map(r => ({
                    code: r.testCode,
                    result_value: r.value,
                    unit: r.unit,
                    abnormal_flag: r.flag
                }))
            }
        };

        // Simulate network delay
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log(">>> [MOCK API] Success: Database updated.", payload);
                resolve(true);
            }, 500);
        });
    },

    // --- 4. DATA GENERATORS (For Simulation / Testing) ---

    generateHL7Order: (sampleId: string, patientName: string, tests: string[]): string => {
        const now = new Date().toISOString().replace(/[-T:Z.]/g, '').slice(0, 14);
        const msgControlId = `MSG${Date.now()}`;
        let msg = `MSH|^~\\&|HIS|CLINIC|ANALYZER|LAB|${now}||ORM^O01|${msgControlId}|P|2.3${CR}`;
        msg += `PID|1||${sampleId}||${patientName}|||M${CR}`;
        msg += `PV1|1|O|OPD^^^|${CR}`;
        msg += `ORC|NW|${sampleId}|||||1^Once${CR}`;
        const testString = tests.map(t => `^^^${t}`).join('~'); 
        msg += `OBR|1|${sampleId}||${testString}|||${now}||||||||${CR}`;
        return msg;
    },

    generateASTMOrder: (sampleId: string, patientName: string, tests: string[]): string => {
        const now = new Date().toISOString().replace(/[-T:Z.]/g, '').slice(0, 14);
        let msg = `${STX}1H|\\^&|||HIS||||||||1${CR}${LF}`;
        msg += `${STX}2P|1||${sampleId}||${patientName}|||M${CR}${LF}`;
        const testString = tests.map(t => `^^^${t}`).join('\\');
        msg += `${STX}3O|1|${sampleId}||${testString}|R||||||N||||||||||||||O${CR}${LF}`;
        msg += `${STX}4L|1|N${CR}${LF}${EOT}`;
        return msg;
    },

    simulateMachineResponse: (protocol: string, inputMessage: string): LisLogEntry[] => {
        const logs: LisLogEntry[] = [];
        const now = new Date().toLocaleTimeString();

        if (protocol === 'HL7') {
            if (inputMessage.includes('MSH')) {
                const ackMsg = `MSH|^~\\&|ANALYZER|LAB|HIS|CLINIC|${new Date().toISOString()}||ACK^O01|ACK${Date.now()}|P|2.3${CR}MSA|AA|${Date.now()}`;
                logs.push({
                    id: Date.now().toString(),
                    timestamp: now,
                    direction: 'IN',
                    message: ackMsg,
                    type: 'ACK'
                });
            }
        } else if (protocol === 'ASTM') {
            logs.push({
                id: Date.now().toString(),
                timestamp: now,
                direction: 'IN',
                message: ACK,
                type: 'ACK'
            });
        }
        return logs;
    },

    simulateIncomingData: (protocol: string, machineType: LisMachineType = 'Hematology'): { log: LisLogEntry, parsed?: LisResultData[] } => {
        const now = new Date();
        const timeStr = now.toLocaleTimeString();
        const timestamp = now.toISOString().replace(/[-T:Z.]/g, '').slice(0, 14);
        const sampleId = `SID${Date.now().toString().slice(-4)}`;
        
        let message = '';
        let parsed: LisResultData[] = [];

        // Define Data Profile based on Machine Type
        let testResults: {code: string, val: string, unit: string, range: string, flag: string}[] = [];

        if (machineType === 'Hematology') {
            const wbc = (Math.random() * 6 + 4).toFixed(1);
            const rbc = (Math.random() * 2 + 3.5).toFixed(2);
            const hgb = Math.floor(Math.random() * 40 + 120).toString();
            const plt = Math.floor(Math.random() * 200 + 150).toString();
            testResults = [
                { code: 'WBC', val: wbc, unit: '10*9/L', range: '4.0-10.0', flag: 'N' },
                { code: 'RBC', val: rbc, unit: '10*12/L', range: '3.8-5.8', flag: 'N' },
                { code: 'HGB', val: hgb, unit: 'g/L', range: '120-160', flag: 'N' },
                { code: 'PLT', val: plt, unit: '10*9/L', range: '150-450', flag: 'N' }
            ];
        } else if (machineType === 'Biochemistry') {
            const glu = (Math.random() * 5 + 3.5).toFixed(1);
            const ure = (Math.random() * 6 + 2).toFixed(1);
            const cre = Math.floor(Math.random() * 60 + 50).toString();
            const alt = Math.floor(Math.random() * 30 + 10).toString();
            testResults = [
                { code: 'GLU', val: glu, unit: 'mmol/L', range: '3.9-6.4', flag: parseFloat(glu) > 6.4 ? 'H' : 'N' },
                { code: 'URE', val: ure, unit: 'mmol/L', range: '2.5-7.5', flag: 'N' },
                { code: 'CRE', val: cre, unit: 'umol/L', range: '62-106', flag: 'N' },
                { code: 'ALT', val: alt, unit: 'U/L', range: '< 40', flag: 'N' }
            ];
        } else if (machineType === 'Immunology') {
            const tsh = (Math.random() * 4 + 0.4).toFixed(2);
            const ft4 = (Math.random() * 10 + 12).toFixed(1);
            const hbsag = Math.random() > 0.9 ? 'POSITIVE' : 'NEGATIVE'; // 10% pos
            testResults = [
                { code: 'TSH', val: tsh, unit: 'uIU/mL', range: '0.4-4.0', flag: 'N' },
                { code: 'FT4', val: ft4, unit: 'pmol/L', range: '12.0-22.0', flag: 'N' },
                { code: 'HBsAg', val: hbsag, unit: 'Qual', range: 'Neg', flag: hbsag === 'POSITIVE' ? 'A' : 'N' }
            ];
        } else if (machineType === 'Urine') {
             testResults = [
                { code: 'GLU', val: 'Neg', unit: 'mg/dL', range: 'Neg', flag: 'N' },
                { code: 'PRO', val: 'Neg', unit: 'mg/dL', range: 'Neg', flag: 'N' },
                { code: 'LEU', val: Math.random() > 0.8 ? '25' : 'Neg', unit: 'Leu/uL', range: 'Neg', flag: 'N' }
            ];
        }

        // BUILD MESSAGE PROTOCOLS
        if (protocol === 'HL7') {
            message = `MSH|^~\\&|ANALYZER|LAB|HIS|CLINIC|${timestamp}||ORU^R01|MSG${Date.now()}|P|2.3${CR}`;
            message += `PID|1||123456||DEMO PATIENT|||M${CR}`;
            message += `OBR|1|${sampleId}||00001^AUTOMATED TEST|||${timestamp}${CR}`;
            
            testResults.forEach((t, idx) => {
                message += `OBX|${idx + 1}|NM|${t.code}||${t.val}|${t.unit}|${t.range}|${t.flag}|||F${CR}`;
            });
            
            // Use internal parser
            parsed = lisService.parseHL7(message).results;

        } else if (protocol === 'ASTM' || protocol === 'Serial') {
            message = `${STX}1H|\\^&|||ANALYZER||||||||1${CR}${LF}`;
            message += `${STX}2P|1||123456||DEMO PATIENT|||M${CR}${LF}`;
            message += `${STX}3O|1|${sampleId}||^^^ALL|R${CR}${LF}`;
            
            testResults.forEach((t, idx) => {
                message += `${STX}${idx + 4}R|${idx + 1}|^^^${t.code}|${t.val}|${t.unit}|${t.range}|${t.flag}${CR}${LF}`;
            });
            
            message += `${STX}${testResults.length + 4}L|1|N${CR}${LF}${EOT}`;
            
            parsed = lisService.parseASTM(message).results;
        }

        return {
            log: {
                id: Date.now().toString(),
                timestamp: timeStr,
                direction: 'IN',
                message: message,
                type: 'DATA',
                parsedData: parsed
            },
            parsed: parsed
        };
    }
};
