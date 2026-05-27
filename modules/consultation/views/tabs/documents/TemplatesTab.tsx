
import React, { useState } from 'react';
import { 
    SearchIcon, 
    PlusIcon, 
    SaveIcon, 
    PrinterIcon, 
    BanIcon,
    DocumentPlusIcon 
} from '../../../../../components/Icons';
import DocumentTree, { TreeNode } from '../../../../../components/ui/DocumentTree';
import HtmlFormEditor from '../../../../../components/ui/HtmlFormEditor';
import { useTheme } from '../../../../../contexts/ThemeContext';

const mockTemplates: TreeNode[] = [
    {
        id: 'GRP_HC', label: 'Giấy tờ hành chính', type: 'folder', children: [
            { id: 'TPL_01', label: 'Đơn đề nghị mượn khối nến/tiêu bản', type: 'file' },
            { id: 'TPL_02', label: 'Giấy cam kết phẫu thuật', type: 'file' },
            { id: 'TPL_03', label: 'Phiếu đăng ký khám bệnh', type: 'file' },
        ]
    },
    {
        id: 'GRP_CM', label: 'Hồ sơ chuyên môn', type: 'folder', children: [
            { id: 'TPL_04', label: 'Bệnh án Ngoại khoa', type: 'file' },
            { id: 'TPL_05', label: 'Phiếu sơ kết 15 ngày điều trị', type: 'file' },
            { id: 'TPL_06', label: 'Biên bản hội chẩn', type: 'file' },
        ]
    },
    {
        id: 'GRP_DD', label: 'Phiếu chăm sóc & Điều dưỡng', type: 'folder', children: [
            { id: 'TPL_07', label: 'Phiếu theo dõi chức năng sống', type: 'file' },
            { id: 'TPL_08', label: 'Phiếu công khai thuốc', type: 'file' },
        ]
    }
];

const TemplatesTab: React.FC = () => {
    const { fontSettings } = useTheme();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);

    return (
        <div className="flex flex-1 overflow-hidden h-full">
            {/* Left: Tree View */}
            <div className="w-1/3 max-w-sm bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col">
                {/* Search */}
                <div className="p-3 border-b border-slate-100 dark:border-slate-700">
                    <div className="relative">
                        <SearchIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400"/>
                        <input 
                            type="text" 
                            placeholder="Tìm mẫu phiếu..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full pl-9 p-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 ${fontSettings.controls}`}
                        />
                    </div>
                </div>
                
                {/* Tree */}
                <DocumentTree 
                    data={mockTemplates} 
                    selectedId={selectedNode?.id || null} 
                    onSelect={setSelectedNode} 
                    searchTerm={searchTerm}
                    defaultExpanded={['GRP_HC']}
                />
                
                {/* Footer Info */}
                <div className="p-2 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 text-center">
                    Hệ thống biểu mẫu chuẩn Version 2.0
                </div>
            </div>

            {/* Right: Form Editor */}
            <div className="flex-1 bg-slate-200 dark:bg-slate-900 relative overflow-hidden flex flex-col">
                {selectedNode ? (
                    <>
                        <div className="flex-1 h-full relative overflow-hidden">
                            <HtmlFormEditor formTitle={selectedNode.label} />
                            
                            {/* Floating Action Bar */}
                            <div className="absolute bottom-6 right-8 flex gap-3 z-20 animate-slide-in-up">
                                <button className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 shadow-xl rounded-full text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 font-bold flex items-center gap-2 transition-transform hover:scale-105">
                                    <BanIcon className="w-4 h-4"/> Hủy
                                </button>
                                <button className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 shadow-xl rounded-full text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-600 font-bold flex items-center gap-2 transition-transform hover:scale-105">
                                    <PrinterIcon className="w-4 h-4"/> In thử
                                </button>
                                <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 shadow-xl rounded-full text-white font-bold flex items-center gap-2 transition-transform hover:scale-105">
                                    <SaveIcon className="w-4 h-4"/> Lưu phiếu
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    /* Empty State */
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500">
                        <DocumentPlusIcon className="w-20 h-20 mb-4 opacity-20"/>
                        <p className="text-lg font-medium">Chọn một mẫu biểu để nhập liệu</p>
                        <p className="text-sm mt-2">Hỗ trợ nhập liệu nhanh và in ấn trực tiếp</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TemplatesTab;
