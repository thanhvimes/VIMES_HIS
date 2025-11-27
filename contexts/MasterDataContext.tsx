import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { DrugItem, CatalogItem, DoctorItem } from '../types'; // Will resolve from types.ts -> types/index.ts
import { mockMasterDataService } from '../services/mockMasterData';

// Define types locally if they were defined in catalogs.ts previously, or reuse if moved to global types.
// Assuming DoctorItem and CatalogItem are now in types/index.ts or we import them from catalogs.ts for now.
// But better to be consistent. I added them to the service mock above, so they should be in types.
// Let's ensure types are consistent. I will extend the types in the service file if needed.
// Re-defining interfaces here to match what was in catalogs.ts to be safe if they weren't fully moved to global types.

// NOTE: Ensure these interfaces are exported from your global types if not already
// For this implementation, we assume they are available or we define them here temporarily.

interface MasterDataContextType {
    drugs: DrugItem[];
    icd10: CatalogItem[];
    doctors: DoctorItem[];
    isLoading: boolean;
    refreshData: () => void;
}

const MasterDataContext = createContext<MasterDataContextType | undefined>(undefined);

export const MasterDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [drugs, setDrugs] = useState<DrugItem[]>([]);
    const [icd10, setIcd10] = useState<CatalogItem[]>([]);
    const [doctors, setDoctors] = useState<DoctorItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [drugsData, icd10Data, doctorsData] = await Promise.all([
                mockMasterDataService.getDrugs(),
                mockMasterDataService.getICD10(),
                mockMasterDataService.getDoctors()
            ]);
            setDrugs(drugsData);
            setIcd10(icd10Data);
            setDoctors(doctorsData);
        } catch (error) {
            console.error("Failed to load master data", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    return (
        <MasterDataContext.Provider value={{ drugs, icd10, doctors, isLoading, refreshData: loadData }}>
            {children}
        </MasterDataContext.Provider>
    );
};

export const useMasterData = () => {
    const context = useContext(MasterDataContext);
    if (context === undefined) {
        throw new Error('useMasterData must be used within a MasterDataProvider');
    }
    return context;
};
