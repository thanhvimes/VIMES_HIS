import { Request, Response } from 'express';
import { query } from '../../config/database';

class ConsultationController {
    async saveClinicalRecord(req: Request, res: Response) {
        try {
            const payload = {
                ...(req as any).body,
                currentUser: (req as any).user?.username || 'admin'
            };

            const result = await query(
                'SELECT hms_save_consultation_v1($1) as result',
                [JSON.stringify(payload)]
            );

            return res.status(200).json(result.rows[0].result);
        } catch (error: any) {
            console.error('Error saving clinical record:', error);
            return res.status(500).json({ 
                success: false, 
                message: error.message 
            });
        }
    }

    async checkInsuranceRules(req: Request, res: Response) {
        try {
            const { docNo, receptIdx } = (req as any).query;
            const doctor = (req as any).user?.username || 'admin';

            const result = await query(
                'SELECT hms_check_insurance_rules_v1($1, $2, $3) as result',
                [docNo, receptIdx, doctor]
            );

            return res.json(result.rows[0].result);
        } catch (error: any) {
            console.error('Error checking insurance rules:', error);
            return res.status(500).json({ 
                success: false, 
                message: error.message 
            });
        }
    }

    async callPatient(req: Request, res: Response) {
        try {
            const { docNo, deptId, roomId, receptIdx } = (req as any).body;
            const status = 'O'; // Open/Call

            const result = await query(
                'SELECT hms_exam_pending_call($1, $2, $3, $4, $5) as result',
                [docNo, deptId, roomId, receptIdx, status]
            );

            return res.json({ 
                success: true, 
                result: result.rows[0].result 
            });
        } catch (error: any) {
            console.error('Error calling patient:', error);
            return res.status(500).json({ 
                success: false, 
                message: error.message 
            });
        }
    }

    async getClinicalHistory(req: Request, res: Response) {
        return res.json([]);
    }

    async getRecordDetail(req: Request, res: Response) {
        try {
            const { id } = (req as any).params;
            const docNo = parseInt(id);

            const result = await query(
                'SELECT hms_get_record_detail_v1($1) as result',
                [docNo]
            );

            if (result.rows.length > 0 && result.rows[0].result) {
                return res.json(result.rows[0].result);
            }
            
            return res.status(404).json({ 
                success: false, 
                message: 'Không tìm thấy thông tin phiếu khám' 
            });
        } catch (error: any) {
            console.error('Error fetching record detail:', error);
            return res.status(500).json({ 
                success: false, 
                message: error.message 
            });
        }
    }

    async savePrescription(req: Request, res: Response) {
        try {
            const payload = {
                ...(req as any).body,
                currentUser: (req as any).user?.username || 'admin'
            };

            const result = await query(
                'SELECT hms_save_prescription_v1($1) as result',
                [JSON.stringify(payload)]
            );

            return res.status(200).json(result.rows[0].result);
        } catch (error: any) {
            console.error('Error saving prescription:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    async searchDrugs(req: Request, res: Response) {
        try {
            const { q } = (req as any).query;
            const result = await query(
                'SELECT hms_search_drugs_v1($1) as result',
                [q || '']
            );
            return res.json({ success: true, data: result.rows[0].result });
        } catch (error: any) {
            console.error('Error searching drugs:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    async getPrescriptionHistory(req: Request, res: Response) {
        try {
            const { docNo } = (req as any).params;
            const sql = `
                SELECT 
                    o.hpo_orderid as id,
                    o.hpo_orderdate as "date",
                    o.hpo_doctor as "doctor",
                    o.hpo_status as status,
                    (SELECT jsonb_agg(jsonb_build_object(
                        'id', l.hpol_itemid,
                        'name', f.hfl_name,
                        'unit', l.hpol_unit,
                        'quantity', l.hpol_qtyorder,
                        'usage', l.hpol_usage
                    )) FROM hms_pharmaorderline l 
                       JOIN hms_feelist f ON l.hpol_itemid = f.hfl_feeid
                       WHERE l.hpol_orderid = o.hpo_orderid
                    ) as drugs
                FROM hms_pharmaorder o
                WHERE o.hpo_docno = $1
                ORDER BY o.hpo_orderdate DESC
            `;
            const result = await query(sql, [docNo]);
            return res.json({ success: true, data: result.rows });
        } catch (error: any) {
            console.error('Error fetching prescription history:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    async getServiceCatalog(req: Request, res: Response) {
        try {
            const { groupId } = (req as any).query;
            const result = await query(
                'SELECT hms_get_service_catalog_v1($1) as result',
                [groupId || null]
            );
            return res.json({ success: true, data: result.rows[0].result });
        } catch (error: any) {
            console.error('Error fetching service catalog:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    async saveServiceOrder(req: Request, res: Response) {
        try {
            const payload = {
                ...(req as any).body,
                currentUser: (req as any).user?.username || 'admin'
            };

            const result = await query(
                'SELECT hms_save_cls_order_v1($1) as result',
                [JSON.stringify(payload)]
            );

            return res.status(200).json(result.rows[0].result);
        } catch (error: any) {
            console.error('Error saving service order:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    async getServiceHistory(req: Request, res: Response) {
        try {
            const { docNo } = (req as any).params;
            const sql = `
                SELECT 
                    o.pcmso_orderid as id,
                    o.pcmso_groupid as type,
                    o.pcmso_status as status,
                    o.pcmso_orderdate as "orderingDate",
                    o.pcmso_doctor as "orderingDoctor",
                    (SELECT jsonb_agg(jsonb_build_object(
                        'id', l.pcmsol_itemid,
                        'name', f.hfl_name,
                        'unit', l.pcmsol_unit,
                        'result', l.pcmsol_result,
                        'note', l.pcmsol_note
                    )) FROM pcms_order_line l 
                       JOIN hms_feelist f ON l.pcmsol_itemid = f.hfl_feeid
                       WHERE l.pcmsol_orderid = o.pcmso_orderid
                    ) as items
                FROM pcms_order o
                WHERE o.pcmso_docno = $1
                ORDER BY o.pcmso_orderdate DESC
            `;
            const result = await query(sql, [docNo]);
            return res.json({ success: true, data: result.rows });
        } catch (error: any) {
            console.error('Error fetching service history:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    async getDiseaseHistory(req: Request, res: Response) {
        try {
            const { patientId } = (req as any).params;
            const sql = `SELECT hdh_owner as owner, hdh_family as family, hdh_drugallergy as drugallergy 
                         FROM hms_disease_hist WHERE hdh_patientno = $1`;
            const result = await query(sql, [patientId]);
            
            if (result.rows.length > 0) {
                return res.json({ success: true, data: result.rows[0] });
            }
            return res.json({ success: true, data: { owner: '', family: '', drugallergy: '' } });
        } catch (error: any) {
            console.error('Error fetching disease history:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    async saveDiseaseHistory(req: Request, res: Response) {
        try {
            const { patientId } = (req as any).params;
            const { owner, family, drugallergy } = (req as any).body;
            const currentUser = (req as any).user?.username || 'admin';

            // Check if exists
            const checkSql = `SELECT 1 FROM hms_disease_hist WHERE hdh_patientno = $1`;
            const exists = await query(checkSql, [patientId]);

            let sql;
            let params;

            if (exists.rows.length > 0) {
                sql = `UPDATE hms_disease_hist 
                       SET hdh_owner = $1, hdh_family = $2, hdh_drugallergy = $3, 
                           hdh_updatedby = $4, hdh_updateddate = CURRENT_TIMESTAMP
                       WHERE hdh_patientno = $5`;
                params = [owner, family, drugallergy, currentUser, patientId];
            } else {
                sql = `INSERT INTO hms_disease_hist 
                       (hdh_patientno, hdh_owner, hdh_family, hdh_drugallergy, hdh_createdby, hdh_createddate)
                       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`;
                params = [patientId, owner, family, drugallergy, currentUser];
            }

            await query(sql, params);
            return res.json({ success: true, message: 'Đã lưu tiền sử bệnh thành công' });
        } catch (error: any) {
            console.error('Error saving disease history:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    async printExamination(req: Request, res: Response) {
        try {
            const { docNo } = (req as any).params;
            
            // Logic lấy dữ liệu từ hms_exam, hms_doc, hms_patient...
            // Sau đó dùng một thư viện như pdfkit hoặc puppeteer để render HTML sang PDF
            
            // GIẢ LẬP: Trả về một file PDF trống hoặc text
            const filename = `PhieuKhamBenh_${docNo}.pdf`;
            
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
            
            // Header tối thiểu của 1 file PDF hơp lệ để trình duyệt nhận diện được
            const dummyPdfContent = "%PDF-1.4\n1 0 obj\n<< /Title (Phieu Kham Benh) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF";
            
            return res.send(Buffer.from(dummyPdfContent));
        } catch (error: any) {
            console.error('Error printing examination:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    // --- Operations (PT/TT) ---
    async getOperationCatalog(req: Request, res: Response) {
        try {
            const { q, groupId } = (req as any).query;
            const result = await query(
                'SELECT hms_get_operation_catalog_v1($1, $2) as result',
                [q || '', groupId || '']
            );
            return res.json({ success: true, data: result.rows[0].result });
        } catch (error: any) {
            console.error('Error fetching operation catalog:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    async getOperations(req: Request, res: Response) {
        try {
            const { docNo } = (req as any).params;
            const result = await query(
                'SELECT hms_get_operation_history_v1($1) as result',
                [docNo]
            );
            return res.json({ success: true, data: result.rows[0].result });
        } catch (error: any) {
            console.error('Error fetching operations:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    async saveOperation(req: Request, res: Response) {
        try {
            const payload = {
                ...(req as any).body,
                user: (req as any).user?.username || 'admin'
            };
            const result = await query(
                'SELECT hms_save_operation_v1($1) as result',
                [JSON.stringify(payload)]
            );
            return res.json(result.rows[0].result);
        } catch (error: any) {
            console.error('Error saving operation:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    async deleteOperation(req: Request, res: Response) {
        try {
            const { id } = (req as any).params;
            const result = await query(
                'SELECT hms_delete_operation_v1($1) as result',
                [id]
            );
            return res.json(result.rows[0].result);
        } catch (error: any) {
            console.error('Error deleting operation:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    async printOperation(req: Request, res: Response) {
        try {
            const { id } = (req as any).params;
            
            // GIẢ LẬP: Trả về một file PDF trống hoặc text cho phiếu PT/TT
            const filename = `Phieu_PTTT_${id}.pdf`;
            
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
            
            const dummyPdfContent = "%PDF-1.4\n1 0 obj\n<< /Title (Phieu Phau Thuat Thu Thuat) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF";
            
            return res.send(Buffer.from(dummyPdfContent));
        } catch (error: any) {
            console.error('Error printing operation:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    async getFees(req: Request, res: Response) {
        try {
            const { docNo } = (req as any).params;
            const result = await query(
                'SELECT hms_get_fee_history_v1($1) as result',
                [docNo]
            );
            return res.json({ success: true, data: result.rows[0].result });
        } catch (error: any) {
            console.error('Error fetching fees:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    async printFees(req: Request, res: Response) {
        try {
            const { docNo } = (req as any).params;
            
            // GIẢ LẬP: Trả về một file PDF trống hoặc text cho bảng kê chi phí
            const filename = `BangKeChiPhi_${docNo}.pdf`;
            
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
            
            const dummyPdfContent = "%PDF-1.4\n1 0 obj\n<< /Title (Bang Ke Chi Phi) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF";
            
            return res.send(Buffer.from(dummyPdfContent));
        } catch (error: any) {
            console.error('Error printing fees:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    async getExamQueue(req: Request, res: Response) {
        try {
            const { status, timePeriod, fromDate, toDate, roomId, isOutpatient, isChronic, deptId: queryDeptId } = (req as any).query;
            const userDeptId = (req as any).user?.deptId;
            // Use query param if provided, otherwise session, otherwise default 'KB'
            const deptId = queryDeptId || userDeptId || 'KB';
            
            const result = await query(
                'SELECT hms_get_exam_queue_v1($1, $2, $3, $4, $5, $6, $7, $8) as result',
                [
                    deptId, 
                    status || 'waiting', 
                    timePeriod || '1',
                    fromDate || null,
                    toDate || null,
                    roomId ? parseInt(roomId as string) : null,
                    isOutpatient === 'true',
                    isChronic === 'true'
                ]
            );
            
            return res.json({ success: true, data: result.rows[0].result });
        } catch (error: any) {
            console.error('Error fetching exam queue:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    async getRooms(req: Request, res: Response) {
        try {
            const deptId = (req as any).user?.deptId || (req as any).query.deptId || 'KB';
            const result = await query(
                'SELECT hms_get_rooms_v1($1) as result',
                [deptId]
            );
            return res.json({ success: true, data: result.rows[0].result });
        } catch (error: any) {
            console.error('Error fetching rooms:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    async getPatientProfile(req: Request, res: Response) {
        try {
            const { patientId } = (req as any).params;
            const docNo = (req as any).query.docNo;
            
            const pId = BigInt(patientId as any);
            const dNo = docNo ? BigInt(docNo as any) : null;

            const result = await query(
                'SELECT hms_get_patient_profile_v1($1, $2) as result',
                [pId, dNo]
            );
            
            return res.json({ success: true, data: result.rows[0].result });
        } catch (error: any) {
            console.error('Error fetching patient profile:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }
}

export default new ConsultationController();
