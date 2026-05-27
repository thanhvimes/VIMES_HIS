/**
 * Display Templates for QMS StandardDisplay & CentralDisplay
 * Each template defines a complete visual theme: colors, fonts, styles.
 */

export interface DisplayTemplate {
  id: string;
  name: string;
  description: string;
  tags: string[];
  layout?: 'classic' | 'modern';
  preview: {
    bg: string;          // background of the preview card
    headerBg: string;    // header bar color
    accent: string;      // main number / accent color
    text: string;        // primary text color
    subText: string;     // secondary text color
    rowEven: string;     // waiting list even rows
    rowOdd: string;      // waiting list odd rows
    tickerBg: string;    // ticker bar background
    tickerText: string;  // ticker text color
    border: string;      // border / separator color
  };
  styles: {
    // Root container
    bgColor: string;
    fontFamily: string;
    // Header
    headerBg: string;
    headerBorder: string;
    headerTextColor: string;
    headerSubColor: string;
    // Calling number
    callingNumberColor: string;
    callingNumberGlow: string;
    callingBgFlash: string;
    // Ticker
    tickerBg: string;
    tickerAccentBg: string;
    tickerAccentText: string;
    tickerTextColor: string;
    // Waiting list sidebar
    sidebarBg: string;
    sidebarBorder: string;
    rowFirstBorderColor: string;
    rowFirstNumberColor: string;
    rowNumberColor: string;
    rowNameColor: string;
    rowSubColor: string;
    rowEvenBg: string;
    // Status badge
    activeBadgeBg: string;
    activeBadgeBorder: string;
    activeBadgeText: string;
    // Bottom bar
    bottomBg: string;
    bottomText: string;
  };
}

export const DISPLAY_TEMPLATES: DisplayTemplate[] = [
  /* ── 1. Airport Dark (default) ─────────────────────────── */
  {
    id: 'airport-dark',
    name: 'Sân Bay (Mặc định)',
    description: 'Nền đen chuyên nghiệp, số vàng phát sáng — phong cách FIDS sân bay quốc tế.',
    tags: ['Tối', 'Chuyên nghiệp', 'Nổi bật'],
    preview: {
      bg: '#060b18',
      headerBg: '#0d1830',
      accent: '#fbbf24',
      text: '#ffffff',
      subText: '#64748b',
      rowEven: 'rgba(255,255,255,0.025)',
      rowOdd: 'transparent',
      tickerBg: '#0a1526',
      tickerText: '#fbbf24',
      border: 'rgba(255,255,255,0.07)',
    },
    styles: {
      bgColor: '#060b18',
      fontFamily: 'inherit',
      headerBg: 'linear-gradient(180deg,#0d1830 0%,#060b18 100%)',
      headerBorder: 'rgba(255,255,255,0.07)',
      headerTextColor: '#ffffff',
      headerSubColor: '#64748b',
      callingNumberColor: '#ffffff',
      callingNumberGlow: '0 0 60px rgba(255,255,255,0.1)',
      callingBgFlash: 'rgba(251,191,36,0.06)',
      tickerBg: '#0a1526',
      tickerAccentBg: 'rgba(245,158,11,0.12)',
      tickerAccentText: '#fbbf24',
      tickerTextColor: '#fbbf24',
      sidebarBg: 'rgba(255,255,255,0.015)',
      sidebarBorder: 'rgba(255,255,255,0.07)',
      rowFirstBorderColor: '#fbbf24',
      rowFirstNumberColor: '#fbbf24',
      rowNumberColor: '#93c5fd',
      rowNameColor: 'rgba(255,255,255,0.9)',
      rowSubColor: '#475569',
      rowEvenBg: 'rgba(255,255,255,0.02)',
      activeBadgeBg: 'rgba(16,185,129,0.1)',
      activeBadgeBorder: 'rgba(16,185,129,0.3)',
      activeBadgeText: '#34d399',
      bottomBg: '#040810',
      bottomText: '#334155',
    },
  },

  /* ── 2. Ocean Blue ─────────────────────────────────────── */
  {
    id: 'ocean-blue',
    name: 'Đại Dương',
    description: 'Gradient xanh biển sâu, hiện đại và mát mẻ — phù hợp phòng khám sang trọng.',
    tags: ['Tối', 'Xanh biển', 'Gradient'],
    preview: {
      bg: '#03070f',
      headerBg: '#051631',
      accent: '#38bdf8',
      text: '#e0f2fe',
      subText: '#64748b',
      rowEven: 'rgba(56,189,248,0.04)',
      rowOdd: 'transparent',
      tickerBg: '#051631',
      tickerText: '#38bdf8',
      border: 'rgba(56,189,248,0.1)',
    },
    styles: {
      bgColor: '#03070f',
      fontFamily: 'inherit',
      headerBg: 'linear-gradient(135deg,#051631 0%,#0a2040 50%,#05162e 100%)',
      headerBorder: 'rgba(56,189,248,0.1)',
      headerTextColor: '#e0f2fe',
      headerSubColor: '#475569',
      callingNumberColor: '#38bdf8',
      callingNumberGlow: '0 0 80px rgba(56,189,248,0.25)',
      callingBgFlash: 'rgba(56,189,248,0.06)',
      tickerBg: '#051631',
      tickerAccentBg: 'rgba(56,189,248,0.12)',
      tickerAccentText: '#38bdf8',
      tickerTextColor: '#7dd3fc',
      sidebarBg: 'rgba(56,189,248,0.02)',
      sidebarBorder: 'rgba(56,189,248,0.08)',
      rowFirstBorderColor: '#38bdf8',
      rowFirstNumberColor: '#38bdf8',
      rowNumberColor: '#7dd3fc',
      rowNameColor: '#e0f2fe',
      rowSubColor: '#475569',
      rowEvenBg: 'rgba(56,189,248,0.03)',
      activeBadgeBg: 'rgba(56,189,248,0.1)',
      activeBadgeBorder: 'rgba(56,189,248,0.3)',
      activeBadgeText: '#38bdf8',
      bottomBg: '#020509',
      bottomText: '#1e3a5f',
    },
  },

  /* ── 3. Forest Green ───────────────────────────────────── */
  {
    id: 'forest-green',
    name: 'Rừng Xanh',
    description: 'Xanh lá thư giãn, gần gũi với thiên nhiên — lý tưởng cho phòng khám gia đình.',
    tags: ['Tối', 'Xanh lá', 'Thư giãn'],
    preview: {
      bg: '#030d06',
      headerBg: '#05180a',
      accent: '#34d399',
      text: '#d1fae5',
      subText: '#4b7063',
      rowEven: 'rgba(52,211,153,0.03)',
      rowOdd: 'transparent',
      tickerBg: '#04120a',
      tickerText: '#34d399',
      border: 'rgba(52,211,153,0.1)',
    },
    styles: {
      bgColor: '#030d06',
      fontFamily: 'inherit',
      headerBg: 'linear-gradient(180deg,#05180a 0%,#030d06 100%)',
      headerBorder: 'rgba(52,211,153,0.08)',
      headerTextColor: '#d1fae5',
      headerSubColor: '#4b7063',
      callingNumberColor: '#34d399',
      callingNumberGlow: '0 0 80px rgba(52,211,153,0.2)',
      callingBgFlash: 'rgba(52,211,153,0.06)',
      tickerBg: '#04120a',
      tickerAccentBg: 'rgba(52,211,153,0.12)',
      tickerAccentText: '#34d399',
      tickerTextColor: '#6ee7b7',
      sidebarBg: 'rgba(52,211,153,0.02)',
      sidebarBorder: 'rgba(52,211,153,0.07)',
      rowFirstBorderColor: '#34d399',
      rowFirstNumberColor: '#34d399',
      rowNumberColor: '#6ee7b7',
      rowNameColor: '#d1fae5',
      rowSubColor: '#3d6b58',
      rowEvenBg: 'rgba(52,211,153,0.02)',
      activeBadgeBg: 'rgba(52,211,153,0.1)',
      activeBadgeBorder: 'rgba(52,211,153,0.3)',
      activeBadgeText: '#34d399',
      bottomBg: '#020a04',
      bottomText: '#1a4030',
    },
  },

  /* ── 4. Hospital Light ─────────────────────────────────── */
  {
    id: 'hospital-light',
    name: 'Bệnh Viện Sáng',
    description: 'Nền trắng sạch sẽ, chuyên nghiệp — kiểu cổ điển thân quen của bệnh viện.',
    tags: ['Sáng', 'Cổ điển', 'Sạch sẽ'],
    preview: {
      bg: '#f8fafc',
      headerBg: '#1d4ed8',
      accent: '#1d4ed8',
      text: '#0f172a',
      subText: '#64748b',
      rowEven: '#f1f5f9',
      rowOdd: '#ffffff',
      tickerBg: '#1e3a8a',
      tickerText: '#ffffff',
      border: '#e2e8f0',
    },
    styles: {
      bgColor: '#f8fafc',
      fontFamily: 'inherit',
      headerBg: 'linear-gradient(135deg,#1d4ed8 0%,#1e40af 100%)',
      headerBorder: '#bfdbfe',
      headerTextColor: '#ffffff',
      headerSubColor: '#bfdbfe',
      callingNumberColor: '#1d4ed8',
      callingNumberGlow: 'none',
      callingBgFlash: '#eff6ff',
      tickerBg: '#1e3a8a',
      tickerAccentBg: 'rgba(255,255,0,0.2)',
      tickerAccentText: '#fef08a',
      tickerTextColor: '#ffffff',
      sidebarBg: '#ffffff',
      sidebarBorder: '#e2e8f0',
      rowFirstBorderColor: '#1d4ed8',
      rowFirstNumberColor: '#1d4ed8',
      rowNumberColor: '#3b82f6',
      rowNameColor: '#0f172a',
      rowSubColor: '#94a3b8',
      rowEvenBg: '#f8fafc',
      activeBadgeBg: '#f0fdf4',
      activeBadgeBorder: '#bbf7d0',
      activeBadgeText: '#16a34a',
      bottomBg: '#f1f5f9',
      bottomText: '#94a3b8',
    },
  },

  /* ── 5. Sunset Red ─────────────────────────────────────── */
  {
    id: 'sunset-red',
    name: 'Hoàng Hôn',
    description: 'Đỏ cam ấm áp, năng lượng cao — dễ nhìn từ xa trong phòng lớn.',
    tags: ['Tối', 'Đỏ cam', 'Nổi bật'],
    preview: {
      bg: '#0d0505',
      headerBg: '#1c0a0a',
      accent: '#f97316',
      text: '#fff7ed',
      subText: '#6b4d3a',
      rowEven: 'rgba(249,115,22,0.04)',
      rowOdd: 'transparent',
      tickerBg: '#150804',
      tickerText: '#f97316',
      border: 'rgba(249,115,22,0.1)',
    },
    styles: {
      bgColor: '#0d0505',
      fontFamily: 'inherit',
      headerBg: 'linear-gradient(135deg,#1c0a08 0%,#0d0505 100%)',
      headerBorder: 'rgba(249,115,22,0.1)',
      headerTextColor: '#fff7ed',
      headerSubColor: '#6b4d3a',
      callingNumberColor: '#f97316',
      callingNumberGlow: '0 0 80px rgba(249,115,22,0.3)',
      callingBgFlash: 'rgba(249,115,22,0.07)',
      tickerBg: '#150804',
      tickerAccentBg: 'rgba(249,115,22,0.15)',
      tickerAccentText: '#f97316',
      tickerTextColor: '#fdba74',
      sidebarBg: 'rgba(249,115,22,0.02)',
      sidebarBorder: 'rgba(249,115,22,0.08)',
      rowFirstBorderColor: '#f97316',
      rowFirstNumberColor: '#f97316',
      rowNumberColor: '#fb923c',
      rowNameColor: '#fff7ed',
      rowSubColor: '#6b4d3a',
      rowEvenBg: 'rgba(249,115,22,0.025)',
      activeBadgeBg: 'rgba(249,115,22,0.1)',
      activeBadgeBorder: 'rgba(249,115,22,0.3)',
      activeBadgeText: '#fb923c',
      bottomBg: '#090303',
      bottomText: '#4a2010',
    },
  },

  /* ── 6. Violet Galaxy (Now Tech Blue/Cyan) ──────────────────────────────────── */
  {
    id: 'violet-galaxy',
    name: 'Thiên Hà',
    description: 'Xanh dương sâu thẳm kết hợp đường vân Cyan rực rỡ — mang đậm chất công nghệ hiện đại.',
    tags: ['Tối', 'Xanh lam', 'Công nghệ'],
    preview: {
      bg: '#012b47',
      headerBg: '#011c30',
      accent: '#00c2ff',
      text: '#ffffff',
      subText: '#7fc5ed',
      rowEven: 'rgba(0,194,255,0.04)',
      rowOdd: 'transparent',
      tickerBg: '#011626',
      tickerText: '#00c2ff',
      border: 'rgba(0,194,255,0.15)',
    },
    styles: {
      bgColor: '#012b47',
      fontFamily: 'inherit',
      headerBg: 'linear-gradient(135deg,#011c30 0%,#012b47 100%)',
      headerBorder: 'rgba(0,194,255,0.2)',
      headerTextColor: '#ffffff',
      headerSubColor: '#7fc5ed',
      callingNumberColor: '#00c2ff',
      callingNumberGlow: '0 0 80px rgba(0,194,255,0.3)',
      callingBgFlash: 'rgba(0,194,255,0.1)',
      tickerBg: '#011626',
      tickerAccentBg: 'rgba(0,194,255,0.15)',
      tickerAccentText: '#00c2ff',
      tickerTextColor: '#b6e8ff',
      sidebarBg: 'rgba(0,194,255,0.02)',
      sidebarBorder: 'rgba(0,194,255,0.1)',
      rowFirstBorderColor: '#00c2ff',
      rowFirstNumberColor: '#00c2ff',
      rowNumberColor: '#74d5fa',
      rowNameColor: '#ffffff',
      rowSubColor: '#53a5d8',
      rowEvenBg: 'rgba(0,194,255,0.03)',
      activeBadgeBg: 'rgba(0,194,255,0.15)',
      activeBadgeBorder: 'rgba(0,194,255,0.4)',
      activeBadgeText: '#00c2ff',
      bottomBg: '#001321',
      bottomText: '#266f97',
    },
  },

  /* ── 7. Truyền Thống (Classic) ──────────────────────────────────── */
  {
    id: 'classic-blue',
    name: 'Truyền Thống',
    description: 'Bố cục cổ điển: Phân chia ngang (Đang khám & Chờ), Màn hình trung tâm dạng khối màu xanh lớn.',
    tags: ['Sáng', 'Truyền thống', 'Cổ điển'],
    layout: 'classic',
    preview: {
      bg: '#ffffff',
      headerBg: '#ffffff',
      accent: '#dc2626',
      text: '#1e3a8a',
      subText: '#475569',
      rowEven: '#ffffff',
      rowOdd: '#f8fafc',
      tickerBg: '#ffffff',
      tickerText: '#1e3a8a',
      border: '#cbd5e1',
    },
    styles: {
      bgColor: '#ffffff',
      fontFamily: 'inherit',
      headerBg: '#ffffff',
      headerBorder: '#cbd5e1',
      headerTextColor: '#1e3a8a',
      headerSubColor: '#475569',
      callingNumberColor: '#dc2626',
      callingNumberGlow: 'none',
      callingBgFlash: '#fee2e2',
      tickerBg: '#ffffff',
      tickerAccentBg: '#fee2e2',
      tickerAccentText: '#dc2626',
      tickerTextColor: '#1e3a8a',
      sidebarBg: '#ffffff',
      sidebarBorder: '#cbd5e1',
      rowFirstBorderColor: '#dc2626',
      rowFirstNumberColor: '#dc2626',
      rowNumberColor: '#1e3a8a',
      rowNameColor: '#1e3a8a',
      rowSubColor: '#475569',
      rowEvenBg: '#ffffff',
      activeBadgeBg: '#f0fdf4',
      activeBadgeBorder: '#bbf7d0',
      activeBadgeText: '#16a34a',
      bottomBg: '#f8fafc',
      bottomText: '#64748b',
    },
  },
  
  /* ── 8. Truyền Thống Xanh Lá ──────────────────────────────────── */
  {
    id: 'classic-green',
    name: 'Sinh Thái (Truyền Thống)',
    description: 'Bố cục truyền thống nhưng sử dụng tone màu xanh lá thiên nhiên, mang lại cảm giác thân thiện.',
    tags: ['Sáng', 'Truyền thống', 'Xanh lá'],
    layout: 'classic',
    preview: {
      bg: '#ffffff',
      headerBg: '#ffffff',
      accent: '#dc2626',
      text: '#166534',
      subText: '#475569',
      rowEven: '#ffffff',
      rowOdd: '#f0fdf4',
      tickerBg: '#ffffff',
      tickerText: '#166534',
      border: '#cbd5e1',
    },
    styles: {
      bgColor: '#ffffff',
      fontFamily: 'inherit',
      headerBg: '#ffffff',
      headerBorder: '#cbd5e1',
      headerTextColor: '#166534',
      headerSubColor: '#475569',
      callingNumberColor: '#dc2626',
      callingNumberGlow: 'none',
      callingBgFlash: '#fee2e2',
      tickerBg: '#ffffff',
      tickerAccentBg: '#fee2e2',
      tickerAccentText: '#dc2626',
      tickerTextColor: '#166534',
      sidebarBg: '#ffffff',
      sidebarBorder: '#cbd5e1',
      rowFirstBorderColor: '#dc2626',
      rowFirstNumberColor: '#dc2626',
      rowNumberColor: '#166534',
      rowNameColor: '#166534',
      rowSubColor: '#475569',
      rowEvenBg: '#ffffff',
      activeBadgeBg: '#f0fdf4',
      activeBadgeBorder: '#bbf7d0',
      activeBadgeText: '#16a34a',
      bottomBg: '#f8fafc',
      bottomText: '#64748b',
    },
  },

  /* ── 9. Truyền Thống Tím ──────────────────────────────────── */
  {
    id: 'classic-purple',
    name: 'Sang Trọng (Truyền Thống)',
    description: 'Bố cục truyền thống sử dụng tone tím hoàng gia, phù hợp cho phòng khám VIP hoặc thẩm mỹ viện.',
    tags: ['Sáng', 'Truyền thống', 'Tím'],
    layout: 'classic',
    preview: {
      bg: '#ffffff',
      headerBg: '#ffffff',
      accent: '#e11d48',
      text: '#4c1d95',
      subText: '#475569',
      rowEven: '#ffffff',
      rowOdd: '#faf5ff',
      tickerBg: '#ffffff',
      tickerText: '#4c1d95',
      border: '#cbd5e1',
    },
    styles: {
      bgColor: '#ffffff',
      fontFamily: 'inherit',
      headerBg: '#ffffff',
      headerBorder: '#cbd5e1',
      headerTextColor: '#4c1d95',
      headerSubColor: '#475569',
      callingNumberColor: '#e11d48',
      callingNumberGlow: 'none',
      callingBgFlash: '#ffe4e6',
      tickerBg: '#ffffff',
      tickerAccentBg: '#ffe4e6',
      tickerAccentText: '#e11d48',
      tickerTextColor: '#4c1d95',
      sidebarBg: '#ffffff',
      sidebarBorder: '#cbd5e1',
      rowFirstBorderColor: '#e11d48',
      rowFirstNumberColor: '#e11d48',
      rowNumberColor: '#4c1d95',
      rowNameColor: '#4c1d95',
      rowSubColor: '#475569',
      rowEvenBg: '#ffffff',
      activeBadgeBg: '#f0fdf4',
      activeBadgeBorder: '#bbf7d0',
      activeBadgeText: '#16a34a',
      bottomBg: '#f8fafc',
      bottomText: '#64748b',
    },
  },
];

export const DEFAULT_TEMPLATE_ID = 'airport-dark';

export const getTemplate = (id?: string): DisplayTemplate =>
  DISPLAY_TEMPLATES.find(t => t.id === id) ?? DISPLAY_TEMPLATES[0];

export const TEMPLATE_STORAGE_KEY = 'qms_display_template';
