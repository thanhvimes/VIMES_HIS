
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { catalogService, CatalogItem } from '../services/catalogService';

interface CatalogContextType {
    provinces: CatalogItem[];
    departments: CatalogItem[];
    ethnicities: CatalogItem[];
    occupations: CatalogItem[];
    objects: CatalogItem[];
    examTypes: CatalogItem[];
    nations: CatalogItem[];
    relationships: CatalogItem[];
    roomsAll: CatalogItem[];
    
    getWards: (provinceId: string | number) => Promise<CatalogItem[]>;
    getReceptionists: (deptId: string) => Promise<CatalogItem[]>;
    getRoomsByDept: (deptId?: string | number) => CatalogItem[];
    
    isLoading: boolean;
    refresh: () => void;
}

const CatalogContext = createContext<CatalogContextType | undefined>(undefined);

export const CatalogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [provinces, setProvinces] = useState<CatalogItem[]>([]);
    const [departments, setDepartments] = useState<CatalogItem[]>([]);
    const [ethnicities, setEthnicities] = useState<CatalogItem[]>([]);
    const [occupations, setOccupations] = useState<CatalogItem[]>([]);
    const [objects, setObjects] = useState<CatalogItem[]>([]);
    const [examTypes, setExamTypes] = useState<CatalogItem[]>([]);
    const [nations, setNations] = useState<CatalogItem[]>([]);
    const [relationships, setRelationships] = useState<CatalogItem[]>([]);
    const [roomsAll, setRoomsAll] = useState<CatalogItem[]>([]);
    
    const [isLoading, setIsLoading] = useState(true);

    const loadAllCatalogs = useCallback(async () => {
        setIsLoading(true);
        console.log("Context: Loading all catalogs (Safe mode)...");
        try {
            const results = await Promise.allSettled([
                catalogService.getProvinces(),
                catalogService.getDepartments(),
                catalogService.getEthnicities(),
                catalogService.getOccupations(),
                catalogService.getObjects(),
                catalogService.getExamTypes(),
                catalogService.getNations(),
                catalogService.getRelationships(),
                catalogService.getRooms()
            ]);
            
            const [
                provs, depts, eths, occs, objs, exams, nats, rels, rms
            ] = results.map(r => r.status === 'fulfilled' ? r.value : []);
            
            setProvinces(provs);
            setDepartments(depts);
            setEthnicities(eths);
            setOccupations(occs);
            setObjects(objs);
            setExamTypes(exams);
            setNations(nats);
            setRelationships(rels);
            setRoomsAll(rms);
            
            console.log(`Context: Loaded ${rms.length} rooms. (Status: P:${provs.length}, D:${depts.length}, E:${eths.length})`);
        } catch (error) {
            console.error("Critical failure in CatalogContext", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadAllCatalogs();
    }, [loadAllCatalogs]);

    const getRoomsByDept = useCallback((deptId?: string | number) => {
        if (!deptId) return roomsAll;
        const target = String(deptId).trim();
        // Backend returns "deptId" alias, so use r.deptId
        return roomsAll.filter(r => String(r.deptId || r.dept_id || '').trim() === target);
    }, [roomsAll]);

    const getWards = useCallback((provinceId: string | number) => catalogService.getWards(provinceId), []);
    const getReceptionists = useCallback((deptId: string) => catalogService.getReceptionists(deptId), []);

    const value = useMemo(() => ({
        provinces, departments, ethnicities, occupations, objects, 
        examTypes, nations, relationships, roomsAll, 
        getWards, getReceptionists, getRoomsByDept, isLoading, 
        refresh: loadAllCatalogs
    }), [
        provinces, departments, ethnicities, occupations, objects, 
        examTypes, nations, relationships, roomsAll, 
        getWards, getReceptionists, getRoomsByDept, isLoading, loadAllCatalogs
    ]);

    return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
};

export const useCatalogs = () => {
    const context = useContext(CatalogContext);
    if (!context) throw new Error('useCatalogs must be used within a CatalogProvider');
    return context;
};
