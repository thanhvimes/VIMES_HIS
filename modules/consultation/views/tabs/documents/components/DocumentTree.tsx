import React, { useState, useMemo, useEffect, memo } from 'react';
import { 
    FolderIcon, 
    DocumentTextIcon, 
    ChevronRightIcon, 
    CheckBadgeIcon, 
    PencilIcon,
    DocumentReportIcon
} from '../../../../../../components/Icons';

export type NodeType = 'folder' | 'file';
export type DocStatus = 'signed' | 'draft' | 'pending';

export interface TreeNode {
    id: string;
    label: string;
    type: NodeType;
    children?: TreeNode[];
    status?: DocStatus;
    date?: string;
    details?: any;
}

interface TreeItemProps {
    node: TreeNode;
    level: number;
    expandedNodes: Set<string>;
    selectedId: string | null;
    onToggle: (id: string) => void;
    onSelect: (node: TreeNode) => void;
}

const TreeItem: React.FC<TreeItemProps> = memo(({ node, level, expandedNodes, selectedId, onToggle, onSelect }) => {
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedId === node.id;
    const hasChildren = node.children && node.children.length > 0;

    const getIcon = () => {
        if (node.type === 'folder') return <FolderIcon className={`w-5 h-5 ${isExpanded ? 'text-yellow-500' : 'text-yellow-400'}`} />;
        if (node.status === 'signed') return <CheckBadgeIcon className="w-5 h-5 text-green-500" />;
        if (node.status === 'draft') return <PencilIcon className="w-4 h-4 text-orange-400" />;
        return <DocumentTextIcon className="w-4 h-4 text-blue-400" />;
    };

    return (
        <div>
            <div 
                className={`
                    flex items-center py-2 px-2 cursor-pointer transition-colors select-none text-sm border-b border-transparent
                    ${isSelected 
                        ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-100 font-medium border-l-4 border-l-blue-600' 
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-l-4 border-l-transparent'
                    }
                `}
                style={{ paddingLeft: `${level * 16 + 8}px` }}
                onClick={() => {
                    if (node.type === 'folder') onToggle(node.id);
                    else onSelect(node);
                }}
            >
                <div className="mr-1.5 text-slate-400">
                    {hasChildren ? (
                        <ChevronRightIcon 
                            className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} 
                            onClick={(e) => { e.stopPropagation(); onToggle(node.id); }}
                        />
                    ) : <div className="w-3.5" />}
                </div>
                <div className="mr-2 flex-shrink-0">{getIcon()}</div>
                <div className="flex-1 min-w-0">
                    <p className="truncate">{node.label}</p>
                    {node.date && <p className="text-[10px] text-slate-400 dark:text-slate-500">{node.date}</p>}
                </div>
            </div>
            {isExpanded && node.children && (
                <div className="animate-fade-in">
                    {node.children.map(child => (
                        <TreeItem 
                            key={child.id} 
                            node={child} 
                            level={level + 1} 
                            expandedNodes={expandedNodes} 
                            selectedId={selectedId} 
                            onToggle={onToggle} 
                            onSelect={onSelect} 
                        />
                    ))}
                </div>
            )}
        </div>
    );
});

interface DocumentTreeProps {
    data: TreeNode[];
    selectedId: string | null;
    onSelect: (node: TreeNode) => void;
    searchTerm?: string;
    defaultExpanded?: string[];
}

const DocumentTree: React.FC<DocumentTreeProps> = ({ data, selectedId, onSelect, searchTerm = '', defaultExpanded = [] }) => {
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(defaultExpanded));

    const toggleNode = (id: string) => {
        const newExpanded = new Set(expandedNodes);
        if (newExpanded.has(id)) newExpanded.delete(id);
        else newExpanded.add(id);
        setExpandedNodes(newExpanded);
    };

    // Filter Logic
    const filterTree = (nodes: TreeNode[], term: string): TreeNode[] => {
        if (!term) return nodes;
        return nodes.reduce((acc: TreeNode[], node) => {
            const matches = node.label.toLowerCase().includes(term.toLowerCase());
            if (node.children) {
                const filteredChildren = filterTree(node.children, term);
                if (matches || filteredChildren.length > 0) {
                    acc.push({ ...node, children: filteredChildren });
                }
            } else if (matches) {
                acc.push(node);
            }
            return acc;
        }, []);
    };

    const displayTree = useMemo(() => filterTree(data, searchTerm), [data, searchTerm]);

    // Expand all on search
    useEffect(() => {
        if (searchTerm) {
            const allIds = new Set<string>();
            const collectIds = (nodes: TreeNode[]) => {
                nodes.forEach(n => {
                    if (n.children) {
                        allIds.add(n.id);
                        collectIds(n.children);
                    }
                });
            };
            collectIds(displayTree);
            setExpandedNodes(allIds);
        }
    }, [searchTerm]);

    return (
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {displayTree.length > 0 ? (
                displayTree.map(node => (
                    <TreeItem 
                        key={node.id} 
                        node={node} 
                        level={0} 
                        expandedNodes={expandedNodes} 
                        selectedId={selectedId} 
                        onToggle={toggleNode} 
                        onSelect={onSelect} 
                    />
                ))
            ) : (
                <div className="text-center py-8 text-slate-400 text-sm">
                    Không tìm thấy tài liệu phù hợp
                </div>
            )}
        </div>
    );
};

export default DocumentTree;