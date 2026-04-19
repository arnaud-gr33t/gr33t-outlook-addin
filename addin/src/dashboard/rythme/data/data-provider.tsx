import * as React from "react";
import { createContext, useContext } from "react";
import type { DashboardData } from "../types/data-contract";
import { mockData } from "./mock-data";

const DashboardDataContext = createContext<DashboardData | null>(null);

export interface DataProviderProps {
  /** Permet d'injecter un dataset custom (tests, storybook). Défaut = mockData. */
  data?: DashboardData;
  children: React.ReactNode;
}

/**
 * Expose le jeu de données `DashboardData` à toute l'arborescence du dashboard
 * Rythme via un React Context. En v1 : le mock. Plus tard : un connecteur Graph.
 */
export const DataProvider: React.FC<DataProviderProps> = ({
  data = mockData,
  children,
}) => {
  return (
    <DashboardDataContext.Provider value={data}>
      {children}
    </DashboardDataContext.Provider>
  );
};

/** Hook principal : retourne les données. Throw si utilisé hors du Provider. */
export function useDashboardData(): DashboardData {
  const ctx = useContext(DashboardDataContext);
  if (!ctx) {
    throw new Error("useDashboardData must be used inside <DataProvider>");
  }
  return ctx;
}
