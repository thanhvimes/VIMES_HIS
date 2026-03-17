-- Check room mapping
SELECT 
    hrk_deptid,
    hrk_id,
    hrk_code,
    hrk_name
FROM hms_roomlist_kios
WHERE hrk_deptid = 'KB' 
  AND hrk_active = 'Y'
ORDER BY hrk_code, hrk_id;

-- This will show which room IDs are actually mapped
-- Then we need to insert schedule for THOSE room IDs, not 65/66/67
