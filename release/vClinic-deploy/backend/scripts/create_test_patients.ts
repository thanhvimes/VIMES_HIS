
import { query } from '../src/config/database';
import { 
    buildPatientPayload, 
    buildDocPayload, 
    buildCardPayload, 
    buildExamPayload, 
    ReceptionFormData 
} from '../src/controllers/reception/helpers';

async function createTestPatients() {
    const testCases: ReceptionFormData[] = [
        {
            name: "Nguyễn Văn Một",
            dob: "1985-01-01",
            gender: "Nam",
            identityCard: "001202" + Math.floor(100000 + Math.random() * 900000),
            phone: "0912111222",
            address: "Hà Nội",
            patientType: "Dịch vụ",
            regRoom: 6,
            regDepartment: "KBQS",
            regExamType: "D0000031",
            regReason: "Khám nội tổng quát"
        },
        {
            name: "Trần Thị Hai",
            dob: "1992-02-02",
            gender: "Nữ",
            identityCard: "001202" + Math.floor(100000 + Math.random() * 900000),
            phone: "0382333444",
            address: "Ninh Bình",
            patientType: "Bảo hiểm",
            route: "Đúng tuyến",
            insuranceNumber: "GD437" + Math.floor(1000000 + Math.random() * 9000000),
            insuranceRegCode: "37001",
            insuranceExp: "2026-12-31",
            regRoom: 6,
            regDepartment: "KBQS",
            regExamType: "D0000031",
            regReason: "Khám định kỳ"
        },
        {
            name: "Lê Văn Ba",
            dob: "1975-03-03",
            gender: "Nam",
            identityCard: "001202" + Math.floor(100000 + Math.random() * 900000),
            phone: "0904555666",
            address: "Thanh Hóa",
            patientType: "Bảo hiểm",
            route: "Trái tuyến",
            insuranceNumber: "DN438" + Math.floor(1000000 + Math.random() * 9000000),
            insuranceRegCode: "38002",
            insuranceExp: "2025-12-25",
            regRoom: 6,
            regDepartment: "KBQS",
            regExamType: "D0000031",
            regReason: "Đau chân"
        },
        {
            name: "Phạm Thị Bốn",
            dob: "2000-04-04",
            gender: "Nữ",
            identityCard: "001202" + Math.floor(100000 + Math.random() * 900000),
            phone: "0966777888",
            address: "Hải Phòng",
            patientType: "Dịch vụ",
            route: "Cấp cứu",
            regRoom: 6,
            regDepartment: "KBQS",
            regExamType: "D0000031",
            regReason: "Cấp cứu đau bụng"
        },
        {
            name: "Hoàng Văn Năm",
            dob: "1980-05-05",
            gender: "Nam",
            identityCard: "001202" + Math.floor(100000 + Math.random() * 900000),
            phone: "0977999000",
            address: "Thái Bình",
            patientType: "Dịch vụ",
            regRoom: 6,
            regDepartment: "KBQS",
            regExamType: "D0000031",
            regReason: "Khám sức khỏe"
        }
    ];

    console.log('🚀 Step 4: Creating 5 test patients with regDepartment KBQS...');

    for (const data of testCases) {
        try {
            const payload = {
                mode: 'ADD_PATIENT',
                currentUser: 'admin',
                patient: buildPatientPayload(data),
                doc: buildDocPayload(data),
                card: buildCardPayload(data),
                exam: buildExamPayload(data)
            };

            const result = await query(
                `SELECT hms_register_patient_v2($1::jsonb) AS data`,
                [JSON.stringify(payload)]
            );

            const dbResult = result.rows[0].data;
            if (dbResult.error) {
                console.error(`❌ DB Error for ${data.name}:`, dbResult.error);
            } else {
                console.log(`✅ Created: ${data.name} | DocNo: ${dbResult.docNo} | PatientNo: ${dbResult.patientNo}`);
            }
        } catch (error: any) {
            console.error(`❌ Failed to create ${data.name}:`, error.message);
        }
    }

    console.log('🏁 Process completed.');
    process.exit(0);
}

createTestPatients();
