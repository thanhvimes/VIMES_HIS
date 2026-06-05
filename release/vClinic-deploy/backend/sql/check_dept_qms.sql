
SELECT json_agg(dept) FROM (
    SELECT 
        d.id, 
        d.name, 
        d.code_prefix,
        COALESCE(
            json_agg(
                json_build_object(
                    'id', r.id, 
                    'name', r.name,
                    'is_active', r.is_active
                ) ORDER BY r.id
            ) FILTER (WHERE r.id IS NOT NULL), 
            '[]'
        ) as rooms
    FROM clinic_queue_departments d
    LEFT JOIN clinic_queue_rooms r ON d.id = r.department_id
    GROUP BY d.id
    ORDER BY d.id ASC
) dept;
