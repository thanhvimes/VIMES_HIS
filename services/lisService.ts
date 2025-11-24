
import { LisLogEntry, LisResultData } from '../types';

// --- HELPERS ---
const STX = '\x02';
const ETX = '\x03';
const EOT = '\x04';
const ENQ = '\x05';
const ACK = '\x06';
const NAK = '\x15';
const CR = '\r';
const LF = '\n';

export const lisService = {
    
    // --- 1. PARSING LOGIC (Core) ---

    /**
     * Parse an HL7 ORU^R01 message (Result)
     */
    parseHL7Result: (rawMessage: string): LisResultData[] => {
        const segments = rawMessage.split(CR).filter(s => s.trim() !== '');
        const results: LisResultData[] = [];

        segments.forEach(segment => {
            if (segment.startsWith('OBX')) {
                // Example: OBX|1|NM|WBC^White Blood Cell||7.5|10*9/L|4.0-10.0|N|||F
                const fields = segment.split('|');
                // HL7 indices are 1-based, array is 0-based.
                // OBX-3: Observation Identifier (Test Code)
                // OBX-5: Observation Value (Result)
                // OBX-6: Units
                // OBX-7: References Range
                // OBX-8: Abnormal Flags
                
                const testIdPart = fields[3] || '';
                const testCode = testIdPart.split('^')[0];
                
                results.push({
                    testCode: testCode,
                    value: fields[5] || '',
                    unit: fields[6] || '',
                    refRange: fields[7] || '',
                    flag: fields[8] || 'N'
                });
            }
        });
        return results;
    },

    /**
     * Parse an ASTM Result Frame (Record Type R)
     */
    parseASTMResult: (rawMessage: string): LisResultData[] => {
        // ASTM records usually start with a record type identifier (H, P, O, R, L, T)
        // Example R record: R|1|^^^WBC|7.5|10*9/L|4.0-10.0|N||F||||20231117090000
        
        const lines = rawMessage.split(LF).map(l => l.trim()).filter(l => l !== '');
        const results: LisResultData[] = [];

        lines.forEach(line => {
            // Strip framing characters (STX, ETX, checksums) if present for easier parsing logic
            const cleanLine = line.replace(/[\x02\x03]/g, '');
            
            if (cleanLine.startsWith('R|')) {
                const fields = cleanLine.split('|');
                // ASTM fields vary by vendor, but commonly:
                // Field 2: Test ID (^^^Code)
                // Field 3: Result
                // Field 4: Unit
                // Field 5: Ref Range
                // Field 6: Flag
                
                const testPart = fields[2] || '';
                const testCode = testPart.replace(/\^/g, ''); // Simple cleanup
                
                results.push({
                    testCode: testCode,
                    value: fields[3] || '',
                    unit: fields[4] || '',
                    refRange: fields[5] || '',
                    flag: fields[6] || 'N'
                });
            }
        });
        return results;
    },

    // --- 2. GENERATION LOGIC (Sending Orders) ---

    /**
     * Generate an HL7 ORM^O01 message (Order)
     */
    generateHL7Order: (sampleId: string, patientName: string, tests: string[]): string => {
        const now = new Date().toISOString().replace(/[-T:Z.]/g, '').slice(0, 14); // YYYYMMDDHHMMSS
        const msgControlId = `MSG${Date.now()}`;
        
        let msg = `MSH|^~\\&|HIS|CLINIC|ANALYZER|LAB|${now}||ORM^O01|${msgControlId}|P|2.3${CR}`;
        msg += `PID|1||${sampleId}||${patientName}|||M${CR}`;
        msg += `PV1|1|O|OPD^^^|${CR}`;
        msg += `ORC|NW|${sampleId}|||||1^Once${CR}`;
        
        // OBR Segment
        // OBR|1|SID123||^CBC^Complete Blood Count|||...
        const testString = tests.map(t => `^^^${t}`).join('~'); // Tách nhau bằng dấu ngã ~ trong HL7
        msg += `OBR|1|${sampleId}||${testString}|||${now}||||||||${CR}`;
        
        return msg;
    },

    /**
     * Generate an ASTM Order (Record Type O)
     */
    generateASTMOrder: (sampleId: string, patientName: string, tests: string[]): string => {
        // Simplified ASTM Frame
        const now = new Date().toISOString().replace(/[-T:Z.]/g, '').slice(0, 14);
        
        let msg = `${STX}1H|\\^&|||HIS||||||||1${CR}${ETX}X${CR}${LF}`; // Header
        msg += `${STX}2P|1||${sampleId}||${patientName}|||M${CR}${ETX}X${CR}${LF}`; // Patient
        
        // Order Record
        // O|1|SID123||^^^WBC\^^^RBC|R|...
        const testString = tests.map(t => `^^^${t}`).join('\\'); // ASTM repeat delimiter often \
        msg += `${STX}3O|1|${sampleId}||${testString}|R||||||N||||||||||||||O${CR}${ETX}X${CR}${LF}`;
        
        msg += `${STX}4L|1|N${CR}${ETX}X${CR}${LF}`; // Terminator
        
        return msg;
    },

    // --- 3. SIMULATION LOGIC (The "Mock Machine") ---

    /**
     * Simulate machine response based on protocol
     */
    simulateMachineResponse: (protocol: string, inputMessage: string): LisLogEntry[] => {
        const logs: LisLogEntry[] = [];
        const now = new Date().toLocaleTimeString();

        if (protocol === 'HL7') {
            // HL7 usually ACKs immediately
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
            // ASTM uses ENQ -> ACK -> STX... -> ACK -> EOT flow
            // We simulate a simple ACK here for the "Order" sent
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

    /**
     * Simulate random incoming result from a machine
     */
    simulateIncomingData: (protocol: string): { log: LisLogEntry, parsed?: LisResultData[] } => {
        const now = new Date();
        const timeStr = now.toLocaleTimeString();
        const timestamp = now.toISOString().replace(/[-T:Z.]/g, '').slice(0, 14);
        
        let message = '';
        let type: 'DATA' = 'DATA';
        let parsed: LisResultData[] = [];

        // Randomize values
        const wbc = (Math.random() * 6 + 4).toFixed(1); // 4-10
        const rbc = (Math.random() * 2 + 3.5).toFixed(2); // 3.5-5.5
        const hgb = Math.floor(Math.random() * 40 + 120).toString(); // 120-160

        if (protocol === 'HL7') {
            message = `MSH|^~\\&|SYSMEX|LAB|HIS|CLINIC|${timestamp}||ORU^R01|MSG${Date.now()}|P|2.3${CR}`;
            message += `PID|1||123456||NGUYEN VAN A|||M${CR}`;
            message += `OBR|1|SID${Date.now().toString().slice(-4)}||00001^AUTOMATED COUNT|||${timestamp}${CR}`;
            message += `OBX|1|NM|WBC||${wbc}|10*9/L|4.0-10.0|N|||F${CR}`;
            message += `OBX|2|NM|RBC||${rbc}|10*12/L|3.8-5.8|N|||F${CR}`;
            message += `OBX|3|NM|HGB||${hgb}|g/L|120-160|N|||F${CR}`;
            
            parsed = lisService.parseHL7Result(message);

        } else if (protocol === 'ASTM') {
            message = `${STX}1H|\\^&|||SYSMEX||||||||1${CR}${LF}`;
            message += `${STX}2P|1||123456||NGUYEN VAN A|||M${CR}${LF}`;
            message += `${STX}3O|1|SID${Date.now().toString().slice(-4)}||^^^CBC|R${CR}${LF}`;
            message += `${STX}4R|1|^^^WBC|${wbc}|10*9/L|4.0-10.0|N${CR}${LF}`;
            message += `${STX}5R|2|^^^RBC|${rbc}|10*12/L|3.8-5.8|N${CR}${LF}`;
            message += `${STX}6L|1|N${CR}${LF}`; // Terminator
            
            parsed = lisService.parseASTMResult(message);
        }

        return {
            log: {
                id: Date.now().toString(),
                timestamp: timeStr,
                direction: 'IN',
                message: message,
                type: type,
                parsedData: parsed
            },
            parsed: parsed
        };
    }
};
