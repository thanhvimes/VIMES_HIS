import axios from 'axios';

async function run() {
    try {
        console.log("=== FETCHING AVAILABLE SLOTS FROM SERVER ===");
        const url = 'http://localhost:3000/api/v1/schedule/slots';
        const response = await axios.get(url, {
            params: {
                deptId: 'KBTN',
                specialityCode: '1',
                date: '2026-06-18'
            }
        });
        
        console.log("Response Status:", response.status);
        const data = response.data as any;
        console.log("Response Data Slots count:", data?.slots?.length);
        if (data?.slots) {
            console.log("Slots returned (first 10):");
            console.table(data.slots.slice(0, 10));
            
            // Check if any slot is in the morning
            const morningSlots = data.slots.filter(s => s.time < '12:00');
            console.log(`Morning slots count returned: ${morningSlots.length}`);
            if (morningSlots.length > 0) {
                console.log("Morning slots details:");
                console.table(morningSlots);
            }
        }
    } catch (e: any) {
        console.error("HTTP Request failed:", e.message);
    }
    process.exit(0);
}

run();
