import axios from 'axios';
import { pool } from '../src/config/database';

async function findOpenSlot() {
  const res = await pool.query(`
    SELECT hse_deptid, hse_roomid, TO_CHAR(hse_date, 'YYYY-MM-DD') as date_str, hse_time
    FROM hms_schedule_exam hse
    JOIN hms_roomlist_kios k ON (k.hrk_id = hse.hse_roomid AND k.hrk_deptid = hse.hse_deptid)
    WHERE hse.hse_date >= CURRENT_DATE + INTERVAL '1 day'
      AND hse.hse_status = 'O'
      AND hse.hse_deptid = 'KB'
      -- Make sure no active bookings exist
      AND NOT EXISTS (
        SELECT 1 FROM qms_patient q
        WHERE q.qms_deptid = hse.hse_deptid
          AND q.qms_roomid = hse.hse_roomid
          AND q.qms_appointment_date = hse.hse_date
          AND q.qms_appointment_time = hse.hse_time
          AND q.qms_status IN ('O', 'S')
      )
    LIMIT 1;
  `);
  return res.rows[0];
}

async function run() {
  try {
    const slot = await findOpenSlot();
    if (!slot) {
      console.log("❌ No open slots found in the future to test with!");
      return;
    }

    const { hse_deptid, hse_roomid, date_str, hse_time } = slot;
    const dateStr = date_str;
    
    // Find specialityCode for this room
    const specRes = await pool.query(`
      SELECT hrk_code FROM hms_roomlist_kios 
      WHERE hrk_deptid = $1 AND hrk_id = $2 AND hrk_active = 'Y' LIMIT 1;
    `, [hse_deptid, hse_roomid]);
    const specialityCode = specRes.rows[0]?.hrk_code || '1';

    console.log(`\n==================================================`);
    console.log(`🧪 TESTING SLOT INTEGRITY FLOW`);
    console.log(`Slot details: Dept=${hse_deptid}, Room=${hse_roomid}, Specialty=${specialityCode}, Date=${dateStr}, Time=${hse_time}`);
    console.log(`==================================================\n`);

    const API_BASE = 'http://localhost:3000/api/v1';

    // Step 1: Verify slot is available
    console.log("➡️ STEP 1: Fetching slots... Expecting the slot to be Available ('O')");
    let slotsRes = await axios.get(`${API_BASE}/schedule/slots`, {
      params: { deptId: hse_deptid, date: dateStr, roomId: hse_roomid }
    });
    let targetSlot = (slotsRes.data as any).slots.find((s: any) => s.time === hse_time);
    console.log(`Slot status: ${targetSlot?.status} (Available: ${targetSlot?.available})`);
    if (targetSlot?.status !== 'O') {
      throw new Error(`Expected slot to be 'O', but got ${targetSlot?.status}`);
    }
    console.log("✅ Step 1 passed.");

    // Step 2: Register a booking for this slot
    console.log("\n➡️ STEP 2: Creating a booking for this slot...");
    const bookingPayload = {
      name: 'TEST PATIENT SLOT INTEGRITY',
      phone: '0999888777',
      birthDate: '1995-05-05',
      gender: 'M',
      deptId: hse_deptid,
      roomId: hse_roomid,
      bookingDate: dateStr,
      bookingTime: hse_time,
      specialityCode: specialityCode,
      reason: 'Slot integrity testing'
    };
    
    const regRes = await axios.post(`${API_BASE}/booking/register`, bookingPayload);
    const bookingId = (regRes.data as any).bookingId;
    console.log(`Booking created successfully! Booking ID: ${bookingId}`);
    console.log("✅ Step 2 passed.");

    // Step 3: Verify slot is now unavailable (Full / 'F')
    console.log("\n➡️ STEP 3: Re-fetching slots... Expecting the slot to be Full ('F') due to pending booking");
    slotsRes = await axios.get(`${API_BASE}/schedule/slots`, {
      params: { deptId: hse_deptid, date: dateStr, roomId: hse_roomid }
    });
    targetSlot = (slotsRes.data as any).slots.find((s: any) => s.time === hse_time);
    console.log(`Slot status: ${targetSlot?.status} (Available: ${targetSlot?.available})`);
    if (targetSlot?.status !== 'F' || targetSlot?.available !== 0) {
      throw new Error(`Expected slot to be 'F' / 0 available, but got ${targetSlot?.status} / ${targetSlot?.available}`);
    }
    console.log("✅ Step 3 passed.");

    // Step 4: Cancel the booking
    console.log(`\n➡️ STEP 4: Cancelling booking ID ${bookingId}...`);
    const cancelRes = await axios.post(`${API_BASE}/booking/${bookingId}/cancel`, {
      reason: 'Testing cleanup slot flow'
    });
    console.log("Cancellation response:", cancelRes.data);
    console.log("✅ Step 4 passed.");

    // Step 5: Verify slot is open again ('O')
    console.log("\n➡️ STEP 5: Re-fetching slots... Expecting the slot to be Available ('O') again");
    slotsRes = await axios.get(`${API_BASE}/schedule/slots`, {
      params: { deptId: hse_deptid, date: dateStr, roomId: hse_roomid }
    });
    targetSlot = (slotsRes.data as any).slots.find((s: any) => s.time === hse_time);
    console.log(`Slot status: ${targetSlot?.status} (Available: ${targetSlot?.available})`);
    if (targetSlot?.status !== 'O') {
      throw new Error(`Expected slot to be 'O' again, but got ${targetSlot?.status}`);
    }
    console.log("✅ Step 5 passed.");

    console.log(`\n🎉 INTEGRATION FLOW TEST COMPLETED SUCCESSFULLY!`);
    console.log(`==================================================`);

  } catch (e: any) {
    console.error("❌ TEST FAILED:", e.response?.data || e.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

run();
