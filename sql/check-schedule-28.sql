-- Quick check: Do we have schedule for 2026-01-28?
SELECT 
    hs_roomid,
    hs_date,
    hs_shift,
    hs_start_time,
    hs_end_time,
    hs_active
FROM hms_schedule
WHERE hs_date = '2026-01-28'
  AND hs_deptid = 'KB'
ORDER BY hs_roomid, hs_start_time;

-- If empty, run this:
-- (Copy from insert-30-days-schedule.sql)
