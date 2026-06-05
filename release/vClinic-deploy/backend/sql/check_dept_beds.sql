SELECT sd_id, sd_name, sd_bednumber, sd_planned_bed 
FROM sys_dept 
WHERE sd_type = 'DT' AND sd_isactive = 'Y'
LIMIT 10;
