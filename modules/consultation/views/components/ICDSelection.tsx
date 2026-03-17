
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ICD10 } from '../../../../types';
import { consultationService } from '../../../../services/consultationService';
import { useTheme } from '../../../../contexts/ThemeContext';
import { SearchIcon, PlusIcon, XMarkIcon, ActivityIcon, PlusCircleIcon } from '../../../../components/Icons';

interface ICDSelectionProps {
  mainDisease?: ICD10;
  subDiseases: ICD10[];
  onMainDiseaseChange: (disease: ICD10) => void;
  onSubDiseasesChange: (diseases: ICD10[]) => void;
  isYHCT?: boolean;
}

const ICDSelection: React.FC<ICDSelectionProps> = ({ 
  mainDisease, 
  subDiseases, 
  onMainDiseaseChange, 
  onSubDiseasesChange,
  isYHCT = false
}) => {
  const { fontSettings } = useTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ICD10[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const searchICD = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const data = await consultationService.searchICD10(q);
      setResults(data);
      setShowDropdown(true);
    } catch (error) {
      console.error('Failed to search ICD:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (query) searchICD(query);
    }, 300);
    return () => clearTimeout(handler);
  }, [query, searchICD]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectRequest = (disease: ICD10, isSupp: boolean) => {
    if (isSupp) {
      if (!subDiseases.find(d => d.code === disease.code)) {
        onSubDiseasesChange([...subDiseases, disease]);
      }
    } else {
      onMainDiseaseChange(disease);
    }
    setShowDropdown(false);
    setQuery('');
  };

  const removeSubDisease = (code: string) => {
    onSubDiseasesChange(subDiseases.filter(d => d.code !== code));
  };

  return (
    <div className="bg-surface dark:bg-dark-surface p-6 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700 space-y-6">
      <div className="flex items-center justify-between border-b dark:border-slate-600 pb-3">
        <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
          <ActivityIcon className="w-6 h-6 text-primary" />
          Chẩn đoán bệnh (ICD10)
        </h2>
      </div>

      <div className="relative" ref={dropdownRef}>
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.length >= 2 && setShowDropdown(true)}
            placeholder="Tìm kiếm mã ICD hoặc tên bệnh..."
            className={`w-full p-3 pl-10 bg-inherit border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all ${fontSettings.controls}`}
          />
          <SearchIcon className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
          {isSearching && (
            <div className="absolute right-3 top-3.5">
              <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
          )}
        </div>

        {showDropdown && results.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl max-h-80 overflow-y-auto">
            {results.map((r) => (
              <div 
                key={r.code} 
                className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700 border-b dark:border-slate-700 last:border-0 flex justify-between items-center group"
              >
                <div className="flex flex-col">
                  <span className="font-bold text-primary dark:text-blue-400">[{r.code}] {r.name}</span>
                  {isYHCT && r.yhctCode && (
                    <span className="text-xs text-slate-500 italic mt-1">YHCT: [{r.yhctCode}] {r.yhctName}</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleSelectRequest(r, false)}
                    className="p-1 px-3 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-md text-xs font-bold transition-all"
                  >
                    Bệnh chính
                  </button>
                  <button 
                    onClick={() => handleSelectRequest(r, true)}
                    className="p-1 px-3 bg-slate-100 dark:bg-slate-600 text-slate-600 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-500 rounded-md text-xs font-bold transition-all"
                  >
                    Kèm theo
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Main Disease */}
        <div className="space-y-3">
          <label className={`block font-bold text-slate-700 dark:text-slate-300 uppercase text-xs tracking-wider ${fontSettings.controls}`}>
            Bệnh chính
          </label>
          {mainDisease ? (
            <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-xl relative overflow-hidden group">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
              <div>
                <span className="font-black text-primary text-lg mr-2">{mainDisease.code}</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">{mainDisease.name}</span>
                {isYHCT && mainDisease.yhctCode && (
                   <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">YHCT: [{mainDisease.yhctCode}] {mainDisease.yhctName}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 border border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-center text-slate-400 italic">
              Chưa chọn bệnh chính
            </div>
          )}
        </div>

        {/* Sub Diseases */}
        <div className="space-y-3">
          <label className={`block font-bold text-slate-700 dark:text-slate-300 uppercase text-xs tracking-wider ${fontSettings.controls}`}>
            Bệnh kèm theo
          </label>
          <div className="space-y-2">
            {subDiseases.length > 0 ? (
              subDiseases.map((d) => (
                <div key={d.code} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-slate-300 transition-all">
                  <div className="flex-1">
                    <span className="font-bold text-slate-600 dark:text-slate-300 mr-2">[{d.code}]</span>
                    <span className="text-slate-700 dark:text-slate-200 text-sm">{d.name}</span>
                  </div>
                  <button 
                    onClick={() => removeSubDisease(d.code)}
                    className="text-slate-400 hover:text-red-500 p-1"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              ))
            ) : (
              <div className="p-4 border border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-center text-slate-400 italic">
                Chưa có bệnh kèm theo
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ICDSelection;
