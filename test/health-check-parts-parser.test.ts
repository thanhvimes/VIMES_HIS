import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseHisPartsSummary,
  mapConclusionRowToClinicalExam,
} from '../src/services/health-check-classifier.service';

describe('Health Check HIS Parts Parser & Specialty Distribution', () => {
  const hisConcatParts =
    'Ngoại khoa: Ngoại khoa bình thường.; Mắt: Mắt phải 10/10, Mắt trái 10/10.; TMH: Tai mũi họng bình thường.; RHM: Răng hàm mặt bình thường.; Da liễu: Bình thường; Sản phụ khoa: Không khám.';

  it('1. parseHisPartsSummary correctly extracts all individual specialties', () => {
    const parsed = parseHisPartsSummary(hisConcatParts);

    assert.equal(parsed.external, 'Ngoại khoa bình thường.');
    assert.equal(parsed.eye, 'Mắt phải 10/10, Mắt trái 10/10.');
    assert.equal(parsed.ent, 'Tai mũi họng bình thường.');
    assert.equal(parsed.dental, 'Răng hàm mặt bình thường.');
    assert.equal(parsed.dermatology, 'Bình thường');
    assert.equal(parsed.gynecology, 'Không khám.');

    // Internal should be empty because only other specialties are in hisConcatParts
    assert.equal(parsed.internal, undefined);
    assert.equal(parsed.cleanInternalText, '');
  });

  it('2. parseHisPartsSummary extracts internal medicine if explicitly present', () => {
    const withInternal =
      'Nội khoa: Tim đều, phổi không rale; Ngoại: Bình thường; Mắt: 10/10';
    const parsed = parseHisPartsSummary(withInternal);

    assert.equal(parsed.internal, 'Tim đều, phổi không rale');
    assert.equal(parsed.cleanInternalText, 'Tim đều, phổi không rale');
    assert.equal(parsed.external, 'Bình thường');
    assert.equal(parsed.eye, '10/10');
  });

  it('3. parseHisPartsSummary handles null, undefined, empty, or pure internal string', () => {
    assert.equal(parseHisPartsSummary(null).cleanInternalText, '');
    assert.equal(parseHisPartsSummary(undefined).cleanInternalText, '');
    assert.equal(parseHisPartsSummary('').cleanInternalText, '');

    const single = 'Bình thường, tim đều';
    const parsedSingle = parseHisPartsSummary(single);
    assert.equal(parsedSingle.cleanInternalText, 'Bình thường, tim đều');
    assert.equal(parsedSingle.external, undefined);
  });

  it('4. mapConclusionRowToClinicalExam prevents other specialties from polluting Khám nội khoa', () => {
    const conclRow = {
      hecl_tuanhoan: '', // empty on HIS conclusion
      hecl_hohap: '',
      hecl_tieuhoa: '',
      hecl_than_tietnieu: '',
      hecl_tamthan_thankinh: '',
      hecl_coxuongkhop: '',
      hecl_noitiet: '',
      hecl_ngoaikhoa: '',
      hecl_mat: '',
      hecl_taimuihong: '',
      hecl_ranghammat: '',
      hecl_dalieu: '',
      hecl_sanphukhoa: '',
      raw_he_parts: hisConcatParts,
    };

    const existingClinExam = {
      // simulate dirty legacy data where tuần hoàn had been set to the multi-specialty string
      noi_khoa_tuan_hoan: hisConcatParts,
      noi_khoa_ho_hap: hisConcatParts,
    };

    const result = mapConclusionRowToClinicalExam(conclRow, existingClinExam, '1');

    // CRITICAL: noi_khoa_tuan_hoan and noi_khoa_ho_hap must NOT contain external, eye, ent, rhm, etc.
    assert.ok(!result.noi_khoa_tuan_hoan.includes('Ngoại khoa:'));
    assert.ok(!result.noi_khoa_tuan_hoan.includes('Mắt:'));
    assert.ok(!result.noi_khoa_tuan_hoan.includes('TMH:'));
    assert.ok(!result.noi_khoa_ho_hap.includes('Ngoại khoa:'));
    assert.ok(!result.noi_khoa_ho_hap.includes('Mắt:'));
    assert.ok(!result.noi_khoa_ho_hap.includes('TMH:'));

    // Should have clean default or clean internal values
    assert.equal(result.noi_khoa_tuan_hoan, 'Tim đều, T1 T2 rõ, bình thường');
    assert.equal(result.noi_khoa_ho_hap, 'Phổi trong, rì rào phế nang rõ, bình thường');

    // And specialties should be distributed correctly
    assert.equal(result.ngoai_khoa, 'Ngoại khoa bình thường.');
    assert.equal(result.mat, 'Mắt phải 10/10, Mắt trái 10/10.');
    assert.equal(result.tai_mui_hong, 'Tai mũi họng bình thường.');
    assert.equal(result.rang_ham_mat, 'Răng hàm mặt bình thường.');
    assert.equal(result.da_lieu, 'Bình thường');
    assert.equal(result.san_phu_khoa, 'Không khám.');
  });

  it('5. mapConclusionRowToClinicalExam prioritizes dedicated conclusion fields over raw_he_parts', () => {
    const conclRow = {
      hecl_tuanhoan: 'Tim đập nhanh nhẹ',
      hecl_hohap: 'Phổi ran rít',
      hecl_ngoaikhoa: 'Sẹo mổ cũ',
      raw_he_parts: hisConcatParts,
    };

    const result = mapConclusionRowToClinicalExam(conclRow, {}, '2');

    assert.equal(result.noi_khoa_tuan_hoan, 'Tim đập nhanh nhẹ');
    assert.equal(result.noi_khoa_ho_hap, 'Phổi ran rít');
    assert.equal(result.ngoai_khoa, 'Sẹo mổ cũ'); // dedicated concl field takes priority
    assert.equal(result.mat, 'Mắt phải 10/10, Mắt trái 10/10.'); // filled from parts
    assert.equal(result.tai_mui_hong, 'Tai mũi họng bình thường.'); // filled from parts
  });
});
