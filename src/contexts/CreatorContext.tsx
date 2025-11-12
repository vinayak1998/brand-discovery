import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface CreatorContextType {
  creatorUuid: string | null;
  setCreatorUuid: (uuid: string) => void;
  clearCreator: () => void;
  isReady: boolean;
}

const CreatorContext = createContext<CreatorContextType | undefined>(undefined);

export const useCreatorContext = () => {
  const context = useContext(CreatorContext);
  if (!context) {
    throw new Error('useCreatorContext must be used within CreatorProvider');
  }
  return context;
};

interface CreatorProviderProps {
  children: ReactNode;
}

export const CreatorProvider = ({ children }: CreatorProviderProps) => {
  const [creatorUuid, setCreatorUuidState] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Initialize from localStorage on mount
  useEffect(() => {
    const storedCreatorId = localStorage.getItem('creator_id');
    if (storedCreatorId) {
      setCreatorUuidState(storedCreatorId);
    }
    setIsReady(true);
  }, []);

  const setCreatorUuid = (uuid: string) => {
    setCreatorUuidState(uuid);
    localStorage.setItem('creator_id', uuid);
  };

  const clearCreator = () => {
    setCreatorUuidState(null);
    localStorage.removeItem('creator_id');
  };

  return (
    <CreatorContext.Provider value={{ creatorUuid, setCreatorUuid, clearCreator, isReady }}>
      {children}
    </CreatorContext.Provider>
  );
};
