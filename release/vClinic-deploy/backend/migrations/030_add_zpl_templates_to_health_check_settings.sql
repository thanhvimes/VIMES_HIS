-- Migration: 030_add_zpl_templates_to_health_check_settings.sql
-- Description: Add ZPL template settings and target printer configuration to health_check_settings table

ALTER TABLE health_check_settings ADD COLUMN IF NOT EXISTS barcode_zpl_template_xn TEXT DEFAULT '^XA
^CF0,26
^FO30,30^FD{hospital}^FS
^FO30,70^FD{patient}^FS
^FO30,105^FD{test}^FS
^FO30,140^FD{sample_type} - {date}^FS
^BY2,2,40
^FO30,175^BCN,,N,N
^FD{code}^FS
^FO30,225^FD{code}^FS
^XZ';

ALTER TABLE health_check_settings ADD COLUMN IF NOT EXISTS barcode_zpl_template_ksk TEXT DEFAULT '^XA
^CF0,26
^FO30,30^FD{hospital}^FS
^FO30,70^FD{patient}^FS
^FO30,105^FD{form_name}^FS
^FO30,140^FD{info}^FS
^BY2,2,40
^FO30,175^BCN,,N,N
^FD{code}^FS
^FO30,225^FD{code}^FS
^XZ';

ALTER TABLE health_check_settings ADD COLUMN IF NOT EXISTS barcode_printer_name VARCHAR(100) DEFAULT 'Zebra';
