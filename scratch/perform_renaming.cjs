const fs = require('fs');
const path = require('path');

const replacements = [
    {
        file: 'd:\\AI\\VIMES_HIS\\.agents\\AGENTS.md',
        replace: [
            { from: /d:\/AI\/vClinic\//g, to: 'd:/AI/VIMES_HIS/' }
        ]
    },
    {
        file: 'd:\\AI\\VIMES_HIS\\capacitor.config.ts',
        replace: [
            { from: /com\.vclinic\.portal/g, to: 'com.vimes.portal' },
            { from: /vClinic Portal/g, to: 'VIMES HIS Portal' }
        ]
    },
    {
        file: 'd:\\AI\\VIMES_HIS\\config\\branding.tsx',
        replace: [
            { from: /vClinicLogoGrad/g, to: 'vimesLogoGrad' },
            { from: /vClinicCrossGrad/g, to: 'vimesCrossGrad' }
        ]
    },
    {
        file: 'd:\\AI\\VIMES_HIS\\services\\qzPrinterService.ts',
        replace: [
            { from: /vClinic/g, to: 'VIMES HIS' }
        ]
    },
    {
        file: 'd:\\AI\\VIMES_HIS\\services\\printerService.ts',
        replace: [
            { from: /vclinic-print-target/g, to: 'vimes-print-target' }
        ]
    },
    {
        file: 'd:\\AI\\VIMES_HIS\\components\\ui\\PdfPreviewModal.tsx',
        replace: [
            { from: /vclinic digital id/g, to: 'vimes digital id' },
            { from: /vClinic CA Internal Trust Network/g, to: 'VIMES CA Internal Trust Network' }
        ]
    },
    {
        file: 'd:\\AI\\VIMES_HIS\\backend\\src\\utils\\audit.ts',
        replace: [
            { from: /'vClinic'/g, to: "'VIMES HIS'" }
        ]
    },
    {
        file: 'd:\\AI\\VIMES_HIS\\backend\\src\\utils\\security.ts',
        replace: [
            { from: /vClinic/g, to: 'VIMES HIS' },
            { from: /vClinic/g, to: 'VIMES HIS' } // just global replacement
        ]
    },
    {
        file: 'd:\\AI\\VIMES_HIS\\backend\\src\\controllers\\queue\\queue.controller.ts',
        replace: [
            { from: /In vClinic/g, to: 'In VIMES HIS' }
        ]
    },
    {
        file: 'd:\\AI\\VIMES_HIS\\backend\\src\\scripts\\migrate_insurance_rules.ts',
        replace: [
            { from: /vClinic mới/g, to: 'VIMES HIS mới' }
        ]
    },
    {
        file: 'd:\\AI\\VIMES_HIS\\backend\\src\\scripts\\convert_encoding.ts',
        replace: [
            { from: /d:\/AI\/vClinic\//g, to: 'd:/AI/VIMES_HIS/' }
        ]
    },
    {
        file: 'd:\\AI\\VIMES_HIS\\verify_settings_flow.cjs',
        replace: [
            { from: /vClinic/g, to: 'VIMES HIS' }
        ]
    },
    {
        file: 'd:\\AI\\VIMES_HIS\\test_vneid_sync.cjs',
        replace: [
            { from: /vClinic/g, to: 'VIMES HIS' }
        ]
    },
    {
        file: 'd:\\AI\\VIMES_HIS\\seed_patients.cjs',
        replace: [
            { from: /d:\/AI\/vClinic\//g, to: 'd:/AI/VIMES_HIS/' },
            { from: /vClinic/g, to: 'VIMES HIS' }
        ]
    },
    {
        file: 'd:\\AI\\VIMES_HIS\\seed_surgery.cjs',
        replace: [
            { from: /d:\/AI\/vClinic\//g, to: 'd:/AI/VIMES_HIS/' },
            { from: /vClinic/g, to: 'VIMES HIS' }
        ]
    },
    {
        file: 'd:\\AI\\VIMES_HIS\\scripts\\package-deploy.cjs',
        replace: [
            { from: /vClinic/g, to: 'VIMES HIS' },
            { from: /vclinic-backend/g, to: 'vimes-his-backend' }
        ]
    },
    {
        file: 'd:\\AI\\VIMES_HIS\\scripts\\deploy-package.cjs',
        replace: [
            { from: /vClinic-deploy/g, to: 'VIMES-HIS-deploy' },
            { from: /vClinic/g, to: 'VIMES HIS' },
            { from: /vclinic-backend/g, to: 'vimes-his-backend' }
        ]
    },
    {
        file: 'd:\\AI\\VIMES_HIS\\TECHNICAL_DOCS.md',
        replace: [
            { from: /vClinic/g, to: 'VIMES HIS' }
        ]
    },
    {
        file: 'd:\\AI\\VIMES_HIS\\TEST_INSTRUCTIONS.md',
        replace: [
            { from: /d:\\AI\\vClinic\\/g, to: 'd:\\AI\\VIMES_HIS\\' }
        ]
    },
    {
        file: 'd:\\AI\\VIMES_HIS\\Tài liệu Triển khai Module Online Booking.md',
        replace: [
            { from: /vClinic/g, to: 'VIMES HIS' },
            { from: /d:\/AI\/vClinic\//g, to: 'd:/AI/VIMES_HIS/' }
        ]
    },
    {
        file: 'd:\\AI\\VIMES_HIS\\DEPLOY_CHECKLIST.md',
        replace: [
            { from: /vClinic-deploy/g, to: 'VIMES-HIS-deploy' },
            { from: /vClinic/g, to: 'VIMES HIS' },
            { from: /vclinic-backend/g, to: 'vimes-his-backend' },
            { from: /d:\\AI\\vClinic/g, to: 'd:\\AI\\VIMES_HIS' }
        ]
    },
    {
        file: 'd:\\AI\\VIMES_HIS\\DEPLOY_README.md',
        replace: [
            { from: /vClinic-deploy/g, to: 'VIMES-HIS-deploy' },
            { from: /vClinic/g, to: 'VIMES HIS' },
            { from: /vclinic-backend/g, to: 'vimes-his-backend' },
            { from: /d:\\AI\\vClinic/g, to: 'd:\\AI\\VIMES_HIS' }
        ]
    },
    {
        file: 'd:\\AI\\VIMES_HIS\\DEPLOY_STEP_BY_STEP.md',
        replace: [
            { from: /vClinic-deploy/g, to: 'VIMES-HIS-deploy' },
            { from: /vClinic/g, to: 'VIMES HIS' },
            { from: /vclinic-backend/g, to: 'vimes-his-backend' },
            { from: /d:\\AI\\vClinic/g, to: 'd:\\AI\\VIMES_HIS' },
            { from: /vClinic/g, to: 'VIMES HIS' }
        ]
    },
    {
        file: 'd:\\AI\\VIMES_HIS\\docs\\PMR_PACS_RIS_Integration_Proposal.md',
        replace: [
            { from: /vClinic/g, to: 'VIMES HIS' }
        ]
    },
    {
        file: 'd:\\AI\\VIMES_HIS\\backend\\.env',
        replace: [
            { from: /vClinic/g, to: 'VIMES HIS' }
        ]
    },
    {
        file: 'd:\\AI\\VIMES_HIS\\backend\\.env.example',
        replace: [
            { from: /vClinic/g, to: 'VIMES HIS' },
            { from: /vclinic/g, to: 'vimes' }
        ]
    },
    {
        file: 'd:\\AI\\VIMES_HIS\\backend\\check_counters.cjs',
        replace: [
            { from: /vClinic/g, to: 'VIMES HIS' }
        ]
    },
    {
        file: 'd:\\AI\\VIMES_HIS\\backend\\check_examview.cjs',
        replace: [
            { from: /vclinic/g, to: 'vimes_his' },
            { from: /d:\/AI\/vClinic\//g, to: 'd:/AI/VIMES_HIS/' }
        ]
    },
    {
        file: 'd:\\AI\\VIMES_HIS\\backend\\check_ksk_data.cjs',
        replace: [
            { from: /vClinic/g, to: 'VIMES HIS' }
        ]
    },
    {
        file: 'd:\\AI\\VIMES_HIS\\backend\\check_pacs.cjs',
        replace: [
            { from: /vclinic/g, to: 'vimes_his' }
        ]
    },
    {
        file: 'd:\\AI\\VIMES_HIS\\backend\\migrations\\005_create_portal_patient_profiles.sql',
        replace: [
            { from: /vClinic/g, to: 'VIMES HIS' }
        ]
    },
    {
        file: 'd:\\AI\\VIMES_HIS\\backend\\migrations\\006_update_cccd_authentication.sql',
        replace: [
            { from: /vClinic/g, to: 'VIMES HIS' }
        ]
    },
    {
        file: 'd:\\AI\\VIMES_HIS\\backend\\migrations\\016_health_check_settings.sql',
        replace: [
            { from: /vClinic/g, to: 'VIMES HIS' }
        ]
    },
    {
        file: 'd:\\AI\\VIMES_HIS\\backend\\migrations\\031_add_his_sync_fields_to_health_check_masters.sql',
        replace: [
            { from: /vClinic/g, to: 'VIMES HIS' }
        ]
    },
    {
        file: 'd:\\AI\\VIMES_HIS\\backend\\migrations\\combined_health_check_sync.sql',
        replace: [
            { from: /vClinic/g, to: 'VIMES HIS' }
        ]
    },
    {
        file: 'd:\\AI\\VIMES_HIS\\backend\\simple-test.js',
        replace: [
            { from: /vClinic/g, to: 'VIMES HIS' }
        ]
    },
    {
        file: 'd:\\AI\\VIMES_HIS\\backend\\sql\\hms_insert_exam_online_source_utf8.sql',
        replace: [
            { from: /d:\\AI\\vClinic\\/g, to: 'd:\\AI\\VIMES_HIS\\' }
        ]
    },
    {
        file: 'd:\\AI\\VIMES_HIS\\backend\\sql\\qms_patient_create_booking_source_utf8.sql',
        replace: [
            { from: /d:\\AI\\vClinic\\/g, to: 'd:\\AI\\VIMES_HIS\\' }
        ]
    },
    {
        file: 'd:\\AI\\VIMES_HIS\\backend\\sql\\qms_register_ticket_online_source_utf8.sql',
        replace: [
            { from: /d:\\AI\\vClinic\\/g, to: 'd:\\AI\\VIMES_HIS\\' }
        ]
    },
    {
        file: 'd:\\AI\\VIMES_HIS\\backend\\sql\\queue-schema.sql',
        replace: [
            { from: /vClinic/g, to: 'VIMES HIS' }
        ]
    },
    {
        file: 'd:\\AI\\VIMES_HIS\\backend\\test_icd_schema.cjs',
        replace: [
            { from: /vclinic/g, to: 'vimes_his' }
        ]
    },
    {
        file: 'd:\\AI\\VIMES_HIS\\BUILD_ERROR_HELP.md',
        replace: [
            { from: /d:\\AI\\vClinic\\/g, to: 'd:\\AI\\VIMES_HIS\\' }
        ]
    }
];

replacements.forEach(({ file, replace }) => {
    if (!fs.existsSync(file)) {
        console.log(`File not found: ${file}`);
        return;
    }
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    replace.forEach(({ from, to }) => {
        content = content.replace(from, to);
    });
    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated file: ${file}`);
    } else {
        console.log(`No changes made to: ${file}`);
    }
});

// Also handle the Postman collection renaming and modifications
const postmanOld = 'd:\\AI\\VIMES_HIS\\vClinic-API.postman_collection.json';
const postmanNew = 'd:\\AI\\VIMES_HIS\\VIMES-HIS-API.postman_collection.json';
if (fs.existsSync(postmanOld)) {
    let content = fs.readFileSync(postmanOld, 'utf8');
    content = content.replace(/"name": "vClinic API"/g, '"name": "VIMES HIS API"');
    content = content.replace(/"_postman_id": "vclinic-api-collection"/g, '"_postman_id": "vimes-his-api-collection"');
    content = content.replace(/"description": "API Collection for vClinic - Hospital Management System"/g, '"description": "API Collection for VIMES HIS - Hospital Management System"');
    fs.writeFileSync(postmanNew, content, 'utf8');
    fs.unlinkSync(postmanOld);
    console.log(`Renamed and updated Postman Collection to: ${postmanNew}`);
}
