-- Migration: 077_update_health_check_child_under_type.sql
-- Description: One-time migration to standardize XML TYPE tag from Child to ChildUnder for KSK records

UPDATE health_check_masters 
SET xml_data = REPLACE(xml_data, '<TYPE>Child</TYPE>', '<TYPE>ChildUnder</TYPE>') 
WHERE xml_data LIKE '%<TYPE>Child</TYPE>%';

UPDATE health_check_masters 
SET signature = REPLACE(signature, '<TYPE>Child</TYPE>', '<TYPE>ChildUnder</TYPE>') 
WHERE signature LIKE '%<TYPE>Child</TYPE>%';
