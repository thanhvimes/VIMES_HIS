-- Migration 053: Seed default room-specialty mappings in hms_roomlist_kios for department KB

INSERT INTO hms_roomlist_kios (hrk_deptid, hrk_id, hrk_code, hrk_active, hrk_createdby)
SELECT 'KB', r.hrl_id, (row_number() OVER (ORDER BY r.hrl_id) % 15) + 1, 'Y', 'system'
FROM hms_roomlist r
WHERE (r.hrl_deptid = 'KB' OR r.hrl_deptid IS NOT NULL)
  AND NOT EXISTS (SELECT 1 FROM hms_roomlist_kios WHERE hrk_deptid = 'KB')
LIMIT 15;
