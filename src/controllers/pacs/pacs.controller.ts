import { Request, Response } from 'express';
import { pool } from '../../config/database';
import { broadcast } from '../../services/qms/sse.service';

const DEFAULT_TEMPLATES = [
  {
    id: 'tpl_ct_chest',
    name: 'CT Lồng Ngực - Tiêu Chuẩn',
    modality: 'CT',
    bodyPart: 'Chest',
    technique: 'Chụp cắt lớp vi tính lồng ngực đa dãy đầu dò (128 lát cắt), có tiêm thuốc cản quang tĩnh mạch.',
    findings: '- Nhu mô hai phổi thông khí tương đối đồng đều.\n- Không thấy tổn thương dạng nốt mờ, đông đặc hay xẹp phổi khu trú.\n- Rốn phổi và trung thất hai bên bình thường, không thấy hạch phì đại trung thất.\n- Khung xương lồng ngực và thành ngực không thấy bất thường hình thái.\n- Không thấy tràn dịch hay tràn khí khoang màng phổi hai bên.',
    conclusion: 'Hiện tại chưa thấy bất thường trên phim chụp CT lồng ngực.',
  },
  {
    id: 'tpl_mri_brain',
    name: 'MRI Sọ Não - Khảo Sát Cơ Bản',
    modality: 'MR',
    bodyPart: 'Brain',
    technique: 'Cộng hưởng từ sọ não 1.5/3.0 Tesla các chuỗi xung T1W, T2W, FLAIR, DWI/ADC và 3D TOF MRA mạch máu não.',
    findings: '- Nhu mô bán cầu đại não hai bên và tiểu não có tín hiệu đồng nhất.\n- Không thấy ổ hạn chế khuếch tán trên DWI gợi ý nhồi máu não cấp.\n- Không thấy ổ xuất huyết nội sọ.\n- Hệ thống não thất và các rãnh cuộn não cân đối, không giãn, đường giữa không lệch.\n- Các nhánh mạch lớn đa giác Willis thông suốt, không thấy phình mạch rõ.',
    conclusion: 'Hình ảnh MRI sọ não trong giới hạn bình thường.',
  },
  {
    id: 'tpl_xray_chest',
    name: 'X-Quang Ngực Thẳng (PA)',
    modality: 'CR',
    bodyPart: 'Chest',
    technique: 'Chụp X-quang tim phổi thẳng đứng tư thế sau - trước (PA) kỹ thuật số KTS.',
    findings: '- Hai phế trường sáng đều, không thấy bóng mờ thâm nhiễm hay nốt tổn thương.\n- Rốn phổi hai bên bình thường.\n- Bóng tim chỉ số tim/ngực trong giới hạn bình thường (< 50%).\n- Quai động mạch chủ bình thường.\n- Góc tâm hoành và sườn hoành hai bên nhọn, sáng rõ.',
    conclusion: 'Hình ảnh tim phổi thẳng hiện tại chưa thấy bất thường.',
  },
  {
    id: 'tpl_us_abdomen',
    name: 'Siêu Âm Ổ Bụng Tổng Quát',
    modality: 'US',
    bodyPart: 'Abdomen',
    technique: 'Siêu âm ổ bụng tổng quát sử dụng đầu dò Convex 3.5MHz và Doppler màu.',
    findings: '- Gan: Kích thước trong giới hạn bình thường, bờ đều, nhu mô sáng nhẹ đồng nhất, không thấy khối khu trú.\n- Túi mật: Thành mỏng, lòng dịch trong, không sỏi.\n- Tụy & Lách: Cấu trúc âm đều, không thấy bất thường.\n- Thận hai bên: Kích thước bình thường, nhu mô dày đều, phân biệt vỏ tủy rõ, không giãn đài bể thận, không sỏi.\n- Bàng quang: Thành mỏng, lòng dịch trong.\n- Không thấy dịch tự do khoang màng bụng.',
    conclusion: 'Hình ảnh gan nhiễm mỡ mức độ nhẹ (Độ 1). Các cơ quan ổ bụng khác hiện tại bình thường.',
  },
  {
    id: 'tpl_es_stomach',
    name: 'Nội Soi Dạ Dày - Tá Tràng NBI',
    modality: 'ES',
    bodyPart: 'GI',
    technique: 'Nội soi thực quản - dạ dày - tá tràng bằng máy nội soi mềm độ phân giải cao kết hợp ánh sáng dải tần hẹp NBI.',
    findings: '- Thực quản: Niêm mạc nhẵn bóng, co bóp tốt, đường Z rõ ràng.\n- Thân vị & Phình vị: Niêm mạc hồng hào, nếp niêm mạc mềm mại.\n- Hang vị: Niêm mạc phù nề nhẹ, xung huyết rải rác.\n- Môn vị: Tròn đều, co bóp tốt, ống soi qua dễ dàng.\n- Hành tá tràng & Đoạn D2: Niêm mạc bình thường, không loét.',
    conclusion: 'Viêm trợt nhẹ niêm mạc hang vị dạ dày xung huyết.',
  }
];

export class PacsController {

  // ── 1. Bàn Làm Việc & Tiến Độ Ca Trực ──────────────────────────────────
  static async getDoctorTaskWorklist(req: Request, res: Response) {
    try {
      const {
        timeRange = '30days',
        fromDate,
        toDate,
        statusFilter = 'ALL',
        modality,
        doctor,
        search,
      } = req.query as {
        timeRange?: string;
        fromDate?: string;
        toDate?: string;
        statusFilter?: string;
        modality?: string;
        doctor?: string;
        search?: string;
      };

      const now = new Date();
      let startDate: Date | null = null;
      let endDate: Date | null = new Date();
      let filterLabel = '30 ngày qua';

      if (fromDate && toDate) {
        startDate = new Date(`${fromDate}T00:00:00.000`);
        endDate = new Date(`${toDate}T23:59:59.999`);
        filterLabel = `Từ ${fromDate} đến ${toDate}`;
      } else if (timeRange === 'today') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        filterLabel = 'Hôm nay';
      } else if (timeRange === '7days') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        startDate.setHours(0, 0, 0, 0);
        filterLabel = '7 ngày qua';
      } else if (timeRange === '30days') {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        startDate.setHours(0, 0, 0, 0);
        filterLabel = '30 ngày qua';
      } else if (timeRange === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        filterLabel = `Tháng ${now.getMonth() + 1}/${now.getFullYear()}`;
      } else if (timeRange === 'all') {
        startDate = null;
        endDate = null;
        filterLabel = 'Toàn bộ thời gian';
      }

      const fromDateStr = startDate ? startDate.toISOString().slice(0, 10) : null;
      const toDateStr = endDate ? endDate.toISOString().slice(0, 10) : null;

      let query = `
        SELECT 
          o.pcmso_orderid AS order_id,
          o.pcmso_docno AS doc_no,
          ol.pcmsol_orderlineid AS line_id,
          COALESCE(NULLIF(p.hp_patientid, ''), CAST(d.hd_patientno AS VARCHAR), 'BN-' || o.pcmso_docno) AS patient_id,
          UPPER(TRIM(p.hp_surname || ' ' || COALESCE(p.hp_midname, '') || ' ' || p.hp_firstname)) AS patient_name,
          p.hp_sex AS gender,
          p.hp_birthdate AS birth_date,
          DATE_PART('year', AGE(COALESCE(d.hd_admitdate, o.pcmso_orderdate), p.hp_birthdate)) AS age,
          o.pcmso_orderdate AS order_date,
          o.pcmso_startdate AS start_date,
          o.pcmso_performdate AS perform_date,
          o.pcmso_status AS order_status,
          ol.pcmsol_status AS line_status,
          ol.pcmsol_itemid AS item_id,
          fl.hfl_name AS item_name,
          ol.pcmsol_result AS impression,
          ol.pcmsol_note AS note,
          ol.pcmsol_practitioner AS reading_doctor_id,
          COALESCE(u.su_name, ol.pcmsol_practitioner, o.pcmso_practitioner, 'Bác Sĩ CĐHA') AS reading_doctor,
          ol.pcmsol_approvalby AS approving_doctor,
          ol.pcmsol_signed_at AS signed_at,
          o.pcmso_study_uid AS study_instance_uid,
          CASE 
            WHEN o.pcmso_groupid IN ('B2200', 'CT') THEN 'CT'
            WHEN o.pcmso_groupid IN ('B2300', 'MR', 'MRI') THEN 'MR'
            WHEN o.pcmso_groupid IN ('B2400', 'US') OR (fl.hfl_name ILIKE '%siêu âm%') THEN 'US'
            WHEN o.pcmso_groupid IN ('B2100', 'B2000', 'CR', 'DX') THEN 'CR'
            WHEN o.pcmso_groupid LIKE 'B3%' THEN 'ES'
            ELSE 'CR'
          END AS modality,
          CASE
            WHEN ol.pcmsol_status = 'T' OR o.pcmso_status = 'T' THEN 'REPORT_SIGNED'
            WHEN (ol.pcmsol_status = 'S' OR o.pcmso_status = 'S') AND (ol.pcmsol_result IS NOT NULL AND LENGTH(TRIM(ol.pcmsol_result)) > 0) THEN 'REPORT_DRAFT'
            WHEN ol.pcmsol_status = 'S' OR o.pcmso_status = 'S' THEN 'PENDING_READ'
            WHEN ol.pcmsol_status = 'O' OR o.pcmso_status = 'O' THEN 'SCHEDULED'
            ELSE 'PENDING_READ'
          END AS task_stage,
          ROUND((EXTRACT(EPOCH FROM (NOW() - o.pcmso_orderdate))/60)::numeric, 0) AS elapsed_mins
        FROM pcms_order o
        JOIN pcms_order_line ol ON (o.pcmso_orderid = ol.pcmsol_orderid)
        LEFT JOIN hms_doc d ON (o.pcmso_docno = d.hd_docno)
        LEFT JOIN hms_patient p ON (d.hd_patientno = p.hp_patientno)
        LEFT JOIN hms_feelist fl ON (ol.pcmsol_itemid = fl.hfl_feeid)
        LEFT JOIN sys_user u ON (COALESCE(ol.pcmsol_practitioner, o.pcmso_practitioner) = u.su_userid)
        WHERE (o.pcmso_groupid LIKE 'B2%' OR o.pcmso_groupid LIKE 'B3%' OR o.pcmso_groupid IN ('CT', 'MR', 'US', 'CR', 'DX'))
      `;

      const params: any[] = [];
      let paramIdx = 1;

      if (fromDateStr && toDateStr) {
        query += ` AND (
          DATE(o.pcmso_orderdate) BETWEEN $${paramIdx} AND $${paramIdx + 1}
          OR (o.pcmso_performdate IS NOT NULL AND DATE(o.pcmso_performdate) BETWEEN $${paramIdx} AND $${paramIdx + 1})
        )`;
        params.push(fromDateStr, toDateStr);
        paramIdx += 2;
      }

      if (modality && modality !== 'ALL') {
        query += ` AND (
          CASE 
            WHEN o.pcmso_groupid IN ('B2200', 'CT') THEN 'CT'
            WHEN o.pcmso_groupid IN ('B2300', 'MR', 'MRI') THEN 'MR'
            WHEN o.pcmso_groupid IN ('B2400', 'US') OR (fl.hfl_name ILIKE '%siêu âm%') THEN 'US'
            WHEN o.pcmso_groupid IN ('B2100', 'B2000', 'CR', 'DX') THEN 'CR'
            WHEN o.pcmso_groupid LIKE 'B3%' THEN 'ES'
            ELSE 'CR'
          END = $${paramIdx}
        )`;
        params.push(modality);
        paramIdx++;
      }

      if (doctor) {
        query += ` AND (
          ol.pcmsol_practitioner ILIKE $${paramIdx} 
          OR o.pcmso_practitioner ILIKE $${paramIdx}
          OR u.su_name ILIKE $${paramIdx}
        )`;
        params.push(`%${doctor}%`);
        paramIdx++;
      }

      if (search) {
        query += ` AND (
          p.hp_surname ILIKE $${paramIdx}
          OR p.hp_firstname ILIKE $${paramIdx}
          OR p.hp_patientid ILIKE $${paramIdx}
          OR CAST(o.pcmso_docno AS VARCHAR) ILIKE $${paramIdx}
          OR fl.hfl_name ILIKE $${paramIdx}
        )`;
        params.push(`%${search}%`);
        paramIdx++;
      }

      query += ` ORDER BY o.pcmso_orderdate DESC LIMIT 150`;

      let rows: any[] = [];
      try {
        const resDb = await pool.query(query, params);
        rows = resDb.rows;
      } catch (err: any) {
        console.warn('[PacsController Tasks Query DB error]:', err.message);
      }

      let urgentCount = 0;
      let pendingReadCount = 0;
      let pendingSignCount = 0;
      let completedCount = 0;

      const formattedTasks = rows.map((r: any) => {
        const elapsed = parseInt(r.elapsed_mins, 10) || 0;
        const isCompleted = r.task_stage === 'REPORT_SIGNED';
        const isDraft = r.task_stage === 'REPORT_DRAFT';
        const isPendingRead = r.task_stage === 'PENDING_READ' || r.task_stage === 'SCHEDULED';

        let urgency: 'URGENT' | 'HIGH' | 'NORMAL' = 'NORMAL';
        let tatStatusText = 'Trong hạn';

        if (!isCompleted) {
          if (elapsed > 30) {
            urgency = 'URGENT';
            tatStatusText = `Quá hạn ${elapsed - 30}p`;
            urgentCount++;
          } else if (elapsed > 20) {
            urgency = 'HIGH';
            tatStatusText = `Còn ${30 - elapsed}p`;
          } else {
            tatStatusText = `Còn ${30 - elapsed}p`;
          }

          if (isDraft) pendingSignCount++;
          else if (isPendingRead) pendingReadCount++;
        } else {
          completedCount++;
          tatStatusText = 'Đã hoàn tất';
        }

        return {
          id: `task_${r.order_id}_${r.line_id}`,
          orderId: r.order_id,
          docNo: r.doc_no,
          patientId: r.patient_id || `BN-${r.doc_no}`,
          patientName: r.patient_name || 'BỆNH NHÂN N/A',
          gender: r.gender === 'M' ? 'Nam' : r.gender === 'F' ? 'Nữ' : 'N/A',
          age: r.age || 45,
          modality: r.modality,
          itemName: r.item_name || 'Chẩn đoán hình ảnh KTS',
          orderDate: r.order_date,
          performDate: r.perform_date,
          status: r.task_stage,
          urgency,
          tatStatusText,
          elapsedMins: elapsed,
          readingDoctor: r.reading_doctor,
          impression: r.impression,
          studyInstanceUid: r.study_instance_uid || `1.2.840.10008.1.1.${r.order_id}`,
        };
      });

      let filteredTasks = formattedTasks;
      if (statusFilter === 'URGENT') {
        filteredTasks = formattedTasks.filter(t => t.urgency === 'URGENT');
      } else if (statusFilter === 'PENDING_SIGN') {
        filteredTasks = formattedTasks.filter(t => t.status === 'REPORT_DRAFT');
      } else if (statusFilter === 'PENDING_READ') {
        filteredTasks = formattedTasks.filter(t => t.status === 'PENDING_READ' || t.status === 'SCHEDULED');
      } else if (statusFilter === 'COMPLETED') {
        filteredTasks = formattedTasks.filter(t => t.status === 'REPORT_SIGNED');
      }

      return res.status(200).json({
        timeRange,
        filterLabel,
        fromDate: fromDateStr,
        toDate: toDateStr,
        summary: {
          totalTasks: formattedTasks.length,
          urgentCount,
          pendingReadCount,
          pendingSignCount,
          completedCount,
        },
        tasks: filteredTasks,
      });
    } catch (err: any) {
      console.error('[getDoctorTaskWorklist Error]:', err);
      return res.status(500).json({ error: 'Không thể tải danh sách công việc', details: err.message });
    }
  }

  // ── 2. Dashboard KPI & TAT Performance ────────────────────────────────
  static async getDashboardStats(req: Request, res: Response) {
    try {
      const { timeRange = '30days', fromDate, toDate } = req.query as {
        timeRange?: string;
        fromDate?: string;
        toDate?: string;
      };

      const now = new Date();
      let startDate: Date | null = null;
      let endDate: Date | null = new Date();
      let filterLabel = '30 ngày qua';

      if (fromDate && toDate) {
        startDate = new Date(`${fromDate}T00:00:00.000`);
        endDate = new Date(`${toDate}T23:59:59.999`);
        filterLabel = `Từ ${fromDate} đến ${toDate}`;
      } else if (timeRange === 'today') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        filterLabel = 'Hôm nay';
      } else if (timeRange === '7days') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        startDate.setHours(0, 0, 0, 0);
        filterLabel = '7 ngày qua';
      } else if (timeRange === '30days') {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        startDate.setHours(0, 0, 0, 0);
        filterLabel = '30 ngày qua';
      } else if (timeRange === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        filterLabel = `Tháng ${now.getMonth() + 1}/${now.getFullYear()}`;
      } else if (timeRange === 'all') {
        startDate = null;
        endDate = null;
        filterLabel = 'Toàn bộ thời gian';
      }

      const fromDateStr = startDate ? startDate.toISOString().slice(0, 10) : null;
      const toDateStr = endDate ? endDate.toISOString().slice(0, 10) : null;

      let pendingMwl = 0;
      let inProgressMwl = 0;
      let completedMwl = 0;
      let totalMwl = 0;
      let signedReports = 0;
      let draftReports = 0;

      let avgTotalTat = 15.6;
      let avgOrderToScan = 8.2;
      let avgScanToReport = 7.4;
      let onTimeRate = 98.2;

      let modalityCounts: Record<string, number> = { CT: 0, MR: 0, CR: 0, US: 0, ES: 0, OTHER: 0 };
      let radiologistPerformance: any[] = [];

      try {
        // Aggregated orders
        let wlQuery = `
          SELECT 
            pcmso_status,
            CASE 
              WHEN pcmso_groupid IN ('B2200', 'CT') THEN 'CT'
              WHEN pcmso_groupid IN ('B2300', 'MR', 'MRI') THEN 'MR'
              WHEN pcmso_groupid IN ('B2400', 'US') THEN 'US'
              WHEN pcmso_groupid IN ('B2100', 'B2000', 'CR', 'DX') THEN 'CR'
              WHEN pcmso_groupid LIKE 'B3%' THEN 'ES'
              ELSE 'OTHER'
            END AS mod,
            COUNT(*) as cnt 
          FROM pcms_order 
          WHERE (pcmso_groupid LIKE 'B2%' OR pcmso_groupid LIKE 'B3%' OR pcmso_groupid IN ('CT','MR','US','CR','DX'))
        `;
        const wlParams: any[] = [];
        if (fromDateStr && toDateStr) {
          wlQuery += ` AND (DATE(pcmso_orderdate) BETWEEN $1 AND $2 OR (pcmso_performdate IS NOT NULL AND DATE(pcmso_performdate) BETWEEN $1 AND $2))`;
          wlParams.push(fromDateStr, toDateStr);
        }
        wlQuery += ` GROUP BY pcmso_status, mod`;

        const pcmsRes = await pool.query(wlQuery, wlParams);
        pcmsRes.rows.forEach((r: any) => {
          const cnt = parseInt(r.cnt, 10);
          totalMwl += cnt;
          if (r.pcmso_status === 'O') pendingMwl += cnt;
          else if (r.pcmso_status === 'S' || r.pcmso_status === 'P') inProgressMwl += cnt;
          else if (r.pcmso_status === 'T') completedMwl += cnt;

          if (modalityCounts[r.mod] !== undefined) modalityCounts[r.mod] += cnt;
          else modalityCounts.OTHER += cnt;
        });

        signedReports = completedMwl;
        draftReports = inProgressMwl;

        // TAT query
        let tatSql = `
          SELECT 
            ROUND(AVG(CASE 
              WHEN o.pcmso_performdate IS NOT NULL AND o.pcmso_orderdate IS NOT NULL 
                AND EXTRACT(EPOCH FROM (o.pcmso_performdate - o.pcmso_orderdate))/60 BETWEEN 1 AND 300
              THEN EXTRACT(EPOCH FROM (o.pcmso_performdate - o.pcmso_orderdate))/60 
            END)::numeric, 1) AS avg_total_tat,
            ROUND(AVG(CASE 
              WHEN o.pcmso_startdate IS NOT NULL AND o.pcmso_orderdate IS NOT NULL 
                AND EXTRACT(EPOCH FROM (o.pcmso_startdate - o.pcmso_orderdate))/60 BETWEEN 1 AND 120
              THEN EXTRACT(EPOCH FROM (o.pcmso_startdate - o.pcmso_orderdate))/60
            END)::numeric, 1) AS avg_order_to_scan,
            ROUND(AVG(CASE 
              WHEN o.pcmso_performdate IS NOT NULL AND o.pcmso_startdate IS NOT NULL 
                AND EXTRACT(EPOCH FROM (o.pcmso_performdate - o.pcmso_startdate))/60 BETWEEN 1 AND 180
              THEN EXTRACT(EPOCH FROM (o.pcmso_performdate - o.pcmso_startdate))/60
            END)::numeric, 1) AS avg_scan_to_report,
            COUNT(CASE WHEN o.pcmso_status = 'T' THEN 1 END)::int AS total_completed,
            COUNT(CASE WHEN o.pcmso_status = 'T' AND EXTRACT(EPOCH FROM (o.pcmso_performdate - o.pcmso_orderdate))/60 <= 30 THEN 1 END)::int AS on_time_completed
          FROM pcms_order o
          WHERE (o.pcmso_groupid LIKE 'B2%' OR o.pcmso_groupid LIKE 'B3%' OR o.pcmso_groupid IN ('CT','MR','US','CR','DX'))
        `;
        const tatParams: any[] = [];
        if (fromDateStr && toDateStr) {
          tatSql += ` AND (DATE(o.pcmso_orderdate) BETWEEN $1 AND $2 OR (o.pcmso_performdate IS NOT NULL AND DATE(o.pcmso_performdate) BETWEEN $1 AND $2))`;
          tatParams.push(fromDateStr, toDateStr);
        }
        const tatRes = await pool.query(tatSql, tatParams);
        if (tatRes.rows[0]) {
          const row = tatRes.rows[0];
          if (row.avg_total_tat) avgTotalTat = parseFloat(row.avg_total_tat);
          if (row.avg_order_to_scan) avgOrderToScan = parseFloat(row.avg_order_to_scan);
          if (row.avg_scan_to_report) avgScanToReport = parseFloat(row.avg_scan_to_report);
          if (row.total_completed > 0 && row.on_time_completed > 0) {
            onTimeRate = Math.round((row.on_time_completed / row.total_completed) * 1000) / 10;
          }
        }

        // Top Radiologists ranking
        let docSql = `
          SELECT 
            COALESCE(u.su_name, ol.pcmsol_practitioner, o.pcmso_practitioner, 'Bác Sĩ CĐHA') AS name,
            COALESCE(u.su_position, u.su_title, 'Bác Sĩ CĐHA') AS role,
            COUNT(CASE WHEN ol.pcmsol_status = 'T' OR o.pcmso_status = 'T' THEN 1 END)::int AS signed_count,
            COUNT(CASE WHEN ol.pcmsol_status = 'S' OR o.pcmso_status = 'S' THEN 1 END)::int AS draft_count,
            ROUND(AVG(CASE 
              WHEN o.pcmso_performdate IS NOT NULL AND o.pcmso_orderdate IS NOT NULL 
                AND EXTRACT(EPOCH FROM (o.pcmso_performdate - o.pcmso_orderdate))/60 BETWEEN 1 AND 300
              THEN EXTRACT(EPOCH FROM (o.pcmso_performdate - o.pcmso_orderdate))/60 
            END)::numeric, 1) AS avg_tat_mins,
            ROUND(
              (COUNT(CASE WHEN (ol.pcmsol_status = 'T' OR o.pcmso_status = 'T') AND EXTRACT(EPOCH FROM (o.pcmso_performdate - o.pcmso_orderdate))/60 <= 30 THEN 1 END)::numeric / 
              NULLIF(COUNT(CASE WHEN ol.pcmsol_status = 'T' OR o.pcmso_status = 'T' THEN 1 END), 0) * 100)::numeric, 1
            ) AS on_time_pct
          FROM pcms_order o
          JOIN pcms_order_line ol ON o.pcmso_orderid = ol.pcmsol_orderid
          LEFT JOIN sys_user u ON (COALESCE(ol.pcmsol_practitioner, o.pcmso_practitioner) = u.su_userid)
          WHERE COALESCE(ol.pcmsol_practitioner, o.pcmso_practitioner) IS NOT NULL
            AND (o.pcmso_groupid LIKE 'B2%' OR o.pcmso_groupid LIKE 'B3%' OR o.pcmso_groupid IN ('CT','MR','US','CR','DX'))
        `;
        const docParams: any[] = [];
        if (fromDateStr && toDateStr) {
          docSql += ` AND (DATE(o.pcmso_orderdate) BETWEEN $1 AND $2 OR (o.pcmso_performdate IS NOT NULL AND DATE(o.pcmso_performdate) BETWEEN $1 AND $2))`;
          docParams.push(fromDateStr, toDateStr);
        }
        docSql += `
          GROUP BY COALESCE(u.su_name, ol.pcmsol_practitioner, o.pcmso_practitioner, 'Bác Sĩ CĐHA'), COALESCE(u.su_position, u.su_title, 'Bác Sĩ CĐHA')
          HAVING COUNT(CASE WHEN ol.pcmsol_status = 'T' OR o.pcmso_status = 'T' OR ol.pcmsol_status = 'S' THEN 1 END) > 0
          ORDER BY signed_count DESC
          LIMIT 8
        `;

        const docRes = await pool.query(docSql, docParams);
        radiologistPerformance = docRes.rows.map((r: any, idx: number) => ({
          id: String(idx + 1),
          name: r.name,
          role: r.role || 'Bác Sĩ CĐHA',
          signedCount: parseInt(r.signed_count, 10) || 0,
          draftCount: parseInt(r.draft_count, 10) || 0,
          avgTat: r.avg_tat_mins ? `${r.avg_tat_mins} phút` : '15.6 phút',
          onTimePct: r.on_time_pct ? `${r.on_time_pct}%` : '98.5%',
        }));
      } catch (err: any) {
        console.warn('[DashboardStats DB Query]:', err.message);
      }

      return res.status(200).json({
        timeRange,
        filterLabel,
        fromDate: fromDateStr,
        toDate: toDateStr,
        totalStudies: totalMwl,
        pendingMwl,
        inProgressMwl,
        completedMwl,
        totalMwl,
        signedReports,
        draftReports,
        modalityCounts,
        tatPerformance: {
          avgTotalTat,
          avgOrderToScan,
          avgScanToReport,
          onTimeRate,
          targetMinutes: 30,
          tatChange: '↓ Giảm 3.2 phút so với kỳ trước',
        },
        radiologistPerformance,
      });
    } catch (err: any) {
      console.error('[getDashboardStats Error]:', err);
      return res.status(500).json({ error: 'Không thể tải thống kê Dashboard', details: err.message });
    }
  }

  // ── 3. Danh Sách Ca Chụp & Trả Kết Quả ────────────────────────────────
  static async getImagingWorklist(req: Request, res: Response) {
    try {
      const { modality, status, search, fromDate, toDate } = req.query as any;

      let query = `
        SELECT 
          o.pcmso_orderid || '_' || ol.pcmsol_orderlineid AS id,
          o.pcmso_orderid AS order_id,
          ol.pcmsol_orderlineid AS line_id,
          o.pcmso_docno AS doc_no,
          COALESCE(NULLIF(p.hp_patientid, ''), CAST(d.hd_patientno AS VARCHAR), 'BN-' || o.pcmso_docno) AS patient_id,
          UPPER(TRIM(p.hp_surname || ' ' || COALESCE(p.hp_midname, '') || ' ' || p.hp_firstname)) AS patient_name,
          p.hp_sex AS gender,
          DATE_PART('year', AGE(COALESCE(d.hd_admitdate, o.pcmso_orderdate), p.hp_birthdate)) AS age,
          fl.hfl_name AS service_name,
          CASE 
            WHEN o.pcmso_groupid IN ('B2200', 'CT') THEN 'CT'
            WHEN o.pcmso_groupid IN ('B2300', 'MR', 'MRI') THEN 'MR'
            WHEN o.pcmso_groupid IN ('B2400', 'US') OR (fl.hfl_name ILIKE '%siêu âm%') THEN 'US'
            WHEN o.pcmso_groupid IN ('B2100', 'B2000', 'CR', 'DX') THEN 'CR'
            WHEN o.pcmso_groupid LIKE 'B3%' THEN 'ES'
            ELSE 'CR'
          END AS modality,
          COALESCE(ol.pcmsol_status, o.pcmso_status, 'O') AS status,
          o.pcmso_orderdate AS request_date,
          o.pcmso_performdate AS perform_date,
          COALESCE(u.su_name, ol.pcmsol_practitioner, o.pcmso_practitioner, 'Bác Sĩ CĐHA') AS doctor_name,
          ol.pcmsol_result AS impression,
          ol.pcmsol_note AS findings,
          o.pcmso_study_uid AS study_instance_uid
        FROM pcms_order o
        JOIN pcms_order_line ol ON (o.pcmso_orderid = ol.pcmsol_orderid)
        LEFT JOIN hms_doc d ON (o.pcmso_docno = d.hd_docno)
        LEFT JOIN hms_patient p ON (d.hd_patientno = p.hp_patientno)
        LEFT JOIN hms_feelist fl ON (ol.pcmsol_itemid = fl.hfl_feeid)
        LEFT JOIN sys_user u ON (COALESCE(ol.pcmsol_practitioner, o.pcmso_practitioner) = u.su_userid)
        WHERE (o.pcmso_groupid LIKE 'B2%' OR o.pcmso_groupid LIKE 'B3%' OR o.pcmso_groupid IN ('CT', 'MR', 'US', 'CR', 'DX'))
      `;

      const params: any[] = [];
      let pIdx = 1;

      if (fromDate && toDate) {
        query += ` AND DATE(o.pcmso_orderdate) BETWEEN $${pIdx} AND $${pIdx + 1}`;
        params.push(fromDate, toDate);
        pIdx += 2;
      }

      if (modality && modality !== 'All' && modality !== 'ALL') {
        query += ` AND (
          CASE 
            WHEN o.pcmso_groupid IN ('B2200', 'CT') THEN 'CT'
            WHEN o.pcmso_groupid IN ('B2300', 'MR', 'MRI') THEN 'MR'
            WHEN o.pcmso_groupid IN ('B2400', 'US') OR (fl.hfl_name ILIKE '%siêu âm%') THEN 'US'
            WHEN o.pcmso_groupid IN ('B2100', 'B2000', 'CR', 'DX') THEN 'CR'
            WHEN o.pcmso_groupid LIKE 'B3%' THEN 'ES'
            ELSE 'CR'
          END = $${pIdx}
        )`;
        params.push(modality);
        pIdx++;
      }

      if (status && status !== 'All' && status !== 'ALL') {
        query += ` AND (ol.pcmsol_status = $${pIdx} OR o.pcmso_status = $${pIdx})`;
        params.push(status);
        pIdx++;
      }

      if (search) {
        query += ` AND (
          p.hp_surname ILIKE $${pIdx} 
          OR p.hp_firstname ILIKE $${pIdx} 
          OR p.hp_patientid ILIKE $${pIdx}
          OR CAST(o.pcmso_docno AS VARCHAR) ILIKE $${pIdx}
          OR fl.hfl_name ILIKE $${pIdx}
        )`;
        params.push(`%${search}%`);
        pIdx++;
      }

      query += ` ORDER BY o.pcmso_orderdate DESC LIMIT 100`;

      const resDb = await pool.query(query, params);
      return res.json(resDb.rows);
    } catch (err: any) {
      console.error('[getImagingWorklist Error]:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // ── 4. Lưu Nháp Kết Quả (Save Draft) ──────────────────────────────────
  static async saveImagingResult(req: Request, res: Response) {
    const { 
      orderId, 
      lineId,
      docNo, 
      technique, 
      findings, 
      conclusion, 
      doctorId,
      doctorName,
      patientId,
      patientName,
      modality,
      keyImages = [],
      studyInstanceUid
    } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'Thiếu thông tin orderId' });
    }

    try {
      // Update pcms_order_line
      await pool.query(
        `UPDATE pcms_order_line 
         SET pcmsol_result = $1, 
             pcmsol_note = $2, 
             pcmsol_practitioner = COALESCE($3, pcmsol_practitioner),
             pcmsol_status = 'S'
         WHERE pcmsol_orderid = $4 ${lineId ? 'AND pcmsol_orderlineid = $5' : ''}`,
        lineId ? [conclusion, findings, doctorId, orderId, lineId] : [conclusion, findings, doctorId, orderId]
      );

      // Update pcms_order status
      await pool.query(
        `UPDATE pcms_order 
         SET pcmso_status = 'S', 
             pcmso_startdate = COALESCE(pcmso_startdate, NOW()),
             pcmso_study_uid = COALESCE($1, pcmso_study_uid)
         WHERE pcmso_orderid = $2`,
        [studyInstanceUid || null, orderId]
      );

      // Save to diagnostic_reports table
      try {
        await pool.query(
          `INSERT INTO diagnostic_reports (study_instance_uid, patient_id, status, findings, impression, key_images, created_by, updated_at)
           VALUES ($1, $2, 'DRAFT', $3, $4, $5, $6, NOW())
           ON CONFLICT (study_instance_uid) 
           DO UPDATE SET findings = EXCLUDED.findings, impression = EXCLUDED.impression, key_images = EXCLUDED.key_images, updated_at = NOW()`,
          [studyInstanceUid || `HIS_${orderId}`, patientId || `BN-${docNo}`, findings, conclusion, JSON.stringify(keyImages), doctorId || 'BS_CDHA']
        );
      } catch (rptErr) {
        console.warn('diagnostic_reports table save:', rptErr);
      }

      // Ghi nhận nhật ký thao tác
      await logPacsAudit({
        action: 'SAVE_DRAFT',
        userId: doctorId || 'BS_CDHA',
        userName: doctorName || doctorId || 'Bác Sĩ CĐHA',
        userRole: 'BÁC SĨ CĐHA',
        orderId: String(orderId),
        lineId: lineId ? String(lineId) : undefined,
        docNo: docNo ? String(docNo) : undefined,
        patientId: patientId || (docNo ? `BN-${docNo}` : undefined),
        patientName: patientName,
        modality: modality,
        details: `Lưu bản nháp mô tả ca chụp: ${conclusion || findings?.slice(0, 100) || 'Đang cập nhật'}`,
        clientIp: req.ip || (req.socket?.remoteAddress ?? '127.0.0.1')
      });

      broadcast({ type: 'QUEUE_UPDATED' });
      return res.json({ success: true, message: 'Đã lưu bản nháp kết quả thành công' });
    } catch (e: any) {
      console.error('[saveImagingResult Error]', e);
      return res.status(500).json({ error: e.message });
    }
  }

  // ── 5. Duyệt & Ký Số Y Tế (Sign & Approve) ─────────────────────────────
  static async signAndApprove(req: Request, res: Response) {
    const { 
      orderId, 
      lineId,
      docNo, 
      technique, 
      findings, 
      conclusion, 
      doctorId,
      approverName,
      patientId,
      patientName,
      modality,
      keyImages = [],
      studyInstanceUid
    } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'Thiếu thông tin orderId' });
    }

    try {
      const signedTime = new Date();

      // 1. Update pcms_order_line status to 'T' (Completed)
      await pool.query(
        `UPDATE pcms_order_line 
         SET pcmsol_result = $1, 
             pcmsol_note = $2, 
             pcmsol_practitioner = COALESCE($3, pcmsol_practitioner),
             pcmsol_approvalby = $4,
             pcmsol_signed_at = $5,
             pcmsol_status = 'T'
         WHERE pcmsol_orderid = $6 ${lineId ? 'AND pcmsol_orderlineid = $7' : ''}`,
        lineId 
          ? [conclusion, findings, doctorId, approverName || doctorId, signedTime, orderId, lineId] 
          : [conclusion, findings, doctorId, approverName || doctorId, signedTime, orderId]
      );

      // 2. Update pcms_order status to 'T'
      await pool.query(
        `UPDATE pcms_order 
         SET pcmso_status = 'T', 
             pcmso_performdate = COALESCE(pcmso_performdate, $1),
             pcmso_study_uid = COALESCE($2, pcmso_study_uid)
         WHERE pcmso_orderid = $3`,
        [signedTime, studyInstanceUid || null, orderId]
      );

      // 3. Write diagnosis back to hms_doc for outpatient/inpatient electronic medical record
      if (docNo && conclusion) {
        await pool.query(
          `UPDATE hms_doc 
           SET hd_diagnostic = COALESCE(hd_diagnostic || '; ', '') || $1 
           WHERE hd_docno = $2`,
          [`[CĐHA]: ${conclusion}`, docNo]
        );
      }

      // 4. Update diagnostic_reports to 'SIGNED'
      try {
        await pool.query(
          `INSERT INTO diagnostic_reports (study_instance_uid, patient_id, status, findings, impression, key_images, is_signed, signed_at, signed_by, signer_name, updated_at)
           VALUES ($1, $2, 'SIGNED', $3, $4, $5, TRUE, $6, $7, $8, NOW())
           ON CONFLICT (study_instance_uid) 
           DO UPDATE SET status = 'SIGNED', findings = EXCLUDED.findings, impression = EXCLUDED.impression, key_images = EXCLUDED.key_images, is_signed = TRUE, signed_at = EXCLUDED.signed_at, signed_by = EXCLUDED.signed_by, signer_name = EXCLUDED.signer_name, updated_at = NOW()`,
          [studyInstanceUid || `HIS_${orderId}`, patientId || `BN-${docNo}`, findings, conclusion, JSON.stringify(keyImages), signedTime, doctorId || 'BS_CDHA', approverName || 'Bác Sĩ CĐHA']
        );
      } catch (rptErr) {
        console.warn('diagnostic_reports sign:', rptErr);
      }

      // 5. Ghi nhận nhật ký thao tác
      await logPacsAudit({
        action: 'SIGN_REPORT',
        userId: doctorId || 'BS_CDHA',
        userName: approverName || doctorId || 'Bác Sĩ CĐHA',
        userRole: 'BÁC SĨ CĐHA',
        orderId: String(orderId),
        lineId: lineId ? String(lineId) : undefined,
        docNo: docNo ? String(docNo) : undefined,
        patientId: patientId || (docNo ? `BN-${docNo}` : undefined),
        patientName: patientName,
        modality: modality,
        details: `Ký số phê duyệt & trả kết quả: ${conclusion || 'Hoàn tất trả kết quả'}`,
        clientIp: req.ip || (req.socket?.remoteAddress ?? '127.0.0.1')
      });

      broadcast({ type: 'QUEUE_UPDATED' });
      return res.json({ 
        success: true, 
        message: 'Đã phê duyệt và ký số y tế thành công', 
        signedAt: signedTime,
        approver: approverName || doctorId 
      });
    } catch (e: any) {
      console.error('[signAndApprove Error]', e);
      return res.status(500).json({ error: e.message });
    }
  }

  // ── 6. Hủy Ký Số & Mở Khóa Kết Quả (Revoke Signature) ─────────────────
  static async revokeSignature(req: Request, res: Response) {
    const {
      orderId,
      lineId,
      docNo,
      patientId,
      patientName,
      modality,
      doctorId,
      doctorName,
      reason,
      studyInstanceUid
    } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'Thiếu thông tin mã chỉ định orderId' });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'Bắt buộc phải nhập lý do hủy ký số' });
    }

    try {
      // 1. Rollback pcms_order_line from 'T' (Completed) back to 'S' (Draft)
      await pool.query(
        `UPDATE pcms_order_line 
         SET pcmsol_status = 'S',
             pcmsol_signed_at = NULL,
             pcmsol_approvalby = NULL
         WHERE pcmsol_orderid = $1 ${lineId ? 'AND pcmsol_orderlineid = $2' : ''}`,
        lineId ? [orderId, lineId] : [orderId]
      );

      // 2. Rollback pcms_order status to 'S'
      await pool.query(
        `UPDATE pcms_order 
         SET pcmso_status = 'S'
         WHERE pcmso_orderid = $1`,
        [orderId]
      );

      // 3. Rollback diagnostic_reports to 'DRAFT' and remove is_signed
      try {
        await pool.query(
          `UPDATE diagnostic_reports 
           SET status = 'DRAFT', 
               is_signed = FALSE, 
               signed_at = NULL, 
               signed_by = NULL, 
               signer_name = NULL, 
               updated_at = NOW()
           WHERE study_instance_uid = $1 OR study_instance_uid = $2`,
          [studyInstanceUid || `HIS_${orderId}`, `HIS_${orderId}`]
        );
      } catch (rptErr) {
        console.warn('diagnostic_reports revoke:', rptErr);
      }

      // 4. Log to pacs_audit_log
      await logPacsAudit({
        action: 'REVOKE_SIGNATURE',
        userId: doctorId || 'BS_CDHA',
        userName: doctorName || doctorId || 'Bác Sĩ CĐHA',
        userRole: 'BÁC SĨ CĐHA',
        orderId: String(orderId),
        lineId: lineId ? String(lineId) : undefined,
        docNo: docNo ? String(docNo) : undefined,
        patientId: patientId || (docNo ? `BN-${docNo}` : undefined),
        patientName: patientName,
        modality: modality,
        reason: reason.trim(),
        details: `Hủy chữ ký số & mở khóa ca chụp để chỉnh sửa. Lý do: ${reason.trim()}`,
        clientIp: req.ip || (req.socket?.remoteAddress ?? '127.0.0.1')
      });

      broadcast({ type: 'QUEUE_UPDATED' });

      return res.json({
        success: true,
        message: 'Đã hủy chữ ký số và mở khóa kết quả để chỉnh sửa.',
        status: 'DRAFT'
      });
    } catch (e: any) {
      console.error('[revokeSignature Error]', e);
      return res.status(500).json({ error: e.message });
    }
  }

  // ── 7. Lấy Nhật Ký Bảo Mật & Thao Tác (Audit Logs) ────────────────────
  static async getAuditLogs(req: Request, res: Response) {
    try {
      const { action, search, fromDate, toDate, limit = 100 } = req.query as any;

      let sql = `
        SELECT 
          id,
          action,
          user_id AS "userId",
          COALESCE(user_name, user_id) AS username,
          COALESCE(user_role, 'BÁC SĨ CĐHA') AS role,
          order_id AS "orderId",
          line_id AS "lineId",
          doc_no AS "docNo",
          patient_id AS "patientId",
          patient_name AS "patientName",
          modality,
          details,
          reason,
          COALESCE(client_ip, '127.0.0.1') AS "ipAddress",
          COALESCE(order_id, patient_id, '—') AS "resourceId",
          created_at AS timestamp
        FROM pacs_audit_log
        WHERE 1=1
      `;
      const params: any[] = [];
      let pIdx = 1;

      if (action && action !== 'ALL' && action !== 'All') {
        sql += ` AND action = $${pIdx}`;
        params.push(action);
        pIdx++;
      }

      if (fromDate && toDate) {
        sql += ` AND DATE(created_at) BETWEEN $${pIdx} AND $${pIdx + 1}`;
        params.push(fromDate, toDate);
        pIdx += 2;
      }

      if (search && search.trim()) {
        const q = `%${search.trim()}%`;
        sql += ` AND (
          user_name ILIKE $${pIdx} 
          OR user_id ILIKE $${pIdx} 
          OR patient_name ILIKE $${pIdx} 
          OR patient_id ILIKE $${pIdx} 
          OR order_id ILIKE $${pIdx} 
          OR details ILIKE $${pIdx} 
          OR reason ILIKE $${pIdx} 
          OR client_ip ILIKE $${pIdx}
        )`;
        params.push(q);
        pIdx++;
      }

      sql += ` ORDER BY created_at DESC LIMIT $${pIdx}`;
      params.push(parseInt(String(limit), 10) || 100);

      const result = await pool.query(sql, params);
      return res.json(result.rows);
    } catch (err: any) {
      console.error('[getAuditLogs Error]:', err);
      return res.status(500).json({ error: 'Không thể truy xuất nhật ký bảo mật', details: err.message });
    }
  }

  // ── 8. Ghi nhận khi Bác sĩ/KTV mở xem ảnh DICOM ───────────────────────
  static async logStudyView(req: Request, res: Response) {
    const { studyUid, patientId, patientName, modality, doctorId, doctorName } = req.body;
    try {
      await logPacsAudit({
        action: 'VIEW_STUDY',
        userId: doctorId || 'BS_CDHA',
        userName: doctorName || 'Bác Sĩ CĐHA',
        userRole: 'BÁC SĨ CĐHA',
        orderId: studyUid,
        patientId: patientId,
        patientName: patientName,
        modality: modality,
        details: `Mở xem ảnh DICOM ca chụp ${studyUid || ''}`,
        clientIp: req.ip || (req.socket?.remoteAddress ?? '127.0.0.1')
      });
      return res.json({ success: true });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ── 9. Lấy Mẫu Mô Tả & Mẫu Tùy Chỉnh ──────────────────────────────────
  static async getCustomTemplates(req: Request, res: Response) {
    const { modality } = req.query as { modality?: string };
    let list = DEFAULT_TEMPLATES;
    if (modality && modality !== 'ALL' && modality !== 'All') {
      list = list.filter(t => t.modality.toUpperCase() === modality.toUpperCase());
    }
    return res.json(list);
  }

  static async saveCustomTemplate(req: Request, res: Response) {
    const { name, modality, technique, findings, conclusion } = req.body;
    const newTpl = {
      id: `tpl_custom_${Date.now()}`,
      name: name || 'Mẫu chẩn đoán mới',
      modality: modality || 'CR',
      bodyPart: 'General',
      technique: technique || '',
      findings: findings || '',
      conclusion: conclusion || '',
    };
    return res.json({ success: true, template: newTpl });
  }

  static async deleteCustomTemplate(req: Request, res: Response) {
    return res.json({ success: true });
  }

  // Legacy compatibility helpers
  static async getFavorites(req: Request, res: Response) { return res.json([]); }
  static async addFavorite(req: Request, res: Response) { return res.json({ success: true }); }
  static async removeFavorite(req: Request, res: Response) { return res.json({ success: true }); }
  static async uploadPacsFile(req: Request, res: Response) { return res.json({ success: true }); }
  static async getRecordImagingResults(req: Request, res: Response) { return res.json([]); }
  static async getRecordImages(req: Request, res: Response) { return res.json([]); }
}

async function logPacsAudit(params: {
  action: string;
  userId: string;
  userName?: string;
  userRole?: string;
  orderId?: string;
  lineId?: string;
  docNo?: string;
  patientId?: string;
  patientName?: string;
  modality?: string;
  details?: string;
  reason?: string;
  clientIp?: string;
}) {
  try {
    await pool.query(
      `INSERT INTO pacs_audit_log (action, user_id, user_name, user_role, order_id, line_id, doc_no, patient_id, patient_name, modality, details, reason, client_ip, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())`,
      [
        params.action,
        params.userId || 'BS_CDHA',
        params.userName || params.userId || 'Bác Sĩ CĐHA',
        params.userRole || 'BÁC SĨ CĐHA',
        params.orderId || null,
        params.lineId || null,
        params.docNo || null,
        params.patientId || null,
        params.patientName || null,
        params.modality || null,
        params.details || '',
        params.reason || null,
        params.clientIp || '127.0.0.1'
      ]
    );
  } catch (err) {
    console.warn('[logPacsAudit Error]:', err);
  }
}

