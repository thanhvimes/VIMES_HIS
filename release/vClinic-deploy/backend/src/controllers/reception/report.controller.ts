
import { Request, Response } from 'express';
import { query } from '../../config/database';

class ReceptionReportController {
    async getPatientExamList(req: Request, res: Response) {
        try {
            const { fromDate, toDate, receptionistId, roomId, patientType } = (req as any).query;

            let sql = `
                SELECT hd_docno AS "SoHs",
                  trim(he_roomid
                  ||'.'
                  ||he_receptno) AS "SoPk",
                  he_updateddate AS "KTKham",
                  he_examdate    AS "examdate",
                  hd_enddate     AS "enddate",
                  trim(hp_surname)
                  ||' '
                  ||trim(hp_midname)
                  ||' '
                  ||trim(hp_firstname)                        AS "HovaTen",
                  hms_getage(DATE(hd_admitdate),hp_birthdate) AS "Tuoi",
                  (SELECT ss_desc FROM sys_sel WHERE ss_id = 'sys_sex' AND ss_code = hp_sex
                  ) AS "Gioi",
                  (SELECT ss_desc
                  FROM sys_sel
                  WHERE ss_id                  = 'sys_occupation'
                  AND CAST(ss_code AS INTEGER) = hp_occupation
                  )                                               AS "NgheNghiep",
                  hd_cardno                                       AS "SoTheBHYT",
                  ''                                              AS "covidobject",
                  hms_getaddress(hp_provid, hp_distid, hp_villid) AS "DiaChi",
                  hd_telephone,
                  hms_getusername(he_doctor) AS "doctor",
                  hfl_name                   AS "kieukham",
                  he_status                  AS "status",
                  he_deptid                  AS "deptid",
                  hfe_unitprice              AS "giatien",
                  hd_telephone               AS "telephone",
                  hms_getusername(hd_createdby) AS "receptionist"
                FROM hms_patient
                LEFT JOIN hms_doc
                ON hd_patientno = hp_patientno
                LEFT JOIN hms_exam
                ON he_docno      = hd_docno
                AND he_patientno = hd_patientno
                LEFT JOIN hms_fee
                ON (he_docno     = hd_docno
                AND he_receptidx = hfe_orderid
                AND hfe_type     ='E' )
                LEFT JOIN hms_fee_list
                ON he_examtype = hfl_feeid
                WHERE 1=1
            `;

            const params: any[] = [];
            let i = 1;

            if (fromDate && toDate) {
                params.push(`${fromDate} 00:00:00`);
                params.push(`${toDate} 23:59:59`);
                sql += ` AND he_examdate BETWEEN $${i++} AND $${i++} `;
            }

            if (receptionistId && receptionistId !== '') {
                params.push(receptionistId);
                sql += ` AND hd_createdby = $${i++} `;
            }

            if (roomId && roomId !== '') {
                params.push(roomId);
                sql += ` AND he_roomid = $${i++}::int `;
            }

            if (patientType === 'insurance') {
                sql += ` AND hd_object = 'I' `;
            } else if (patientType === 'service') {
                sql += ` AND hd_object = 'S' `;
            }

            sql += ` ORDER BY he_examdate `;
            console.log(sql);
            const result = await query(sql, params);
            return res.json(result.rows);
        } catch (error: any) {
            console.error('getPatientExamList error:', error);
            return res.status(500).json({ error: error.message });
        }
    }
}

export default new ReceptionReportController();
