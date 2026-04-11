import * as React from "react";
import { useState, useCallback } from "react";
import { Toaster, useId, useToastController, Toast, ToastTitle } from "@fluentui/react-components";
import { mockWeekData } from "../data/mockData";
import type { FactorType } from "../types";
import TaskPane from "./TaskPane";

/**
 * Composant racine du TaskPane Gr33t.
 *
 * Détient l'état global :
 * - selectedDayIndex : jour actuellement affiché (0 = Lundi, 4 = Vendredi)
 * - hoveredFactor : facteur survolé pour afficher l'overlay correspondant sur la timeline
 *
 * Orchestre TaskPane qui descend les props aux sous-composants.
 */
const App: React.FC = () => {
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [hoveredFactor, setHoveredFactor] = useState<FactorType | null>(null);

  // Toaster Fluent pour le bouton "Actualiser"
  const toasterId = useId("gr33t-toaster");
  const { dispatchToast } = useToastController(toasterId);

  const handleSelectDay = useCallback((index: number) => {
    setSelectedDayIndex(index);
  }, []);

  const handleHoverFactor = useCallback((type: FactorType | null) => {
    setHoveredFactor(type);
  }, []);

  const handleClose = useCallback(() => {
    // Tentative de fermeture via Office (API Mailbox 1.5+)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const officeAny = Office as any;
      if (officeAny?.addin?.hide) {
        officeAny.addin.hide();
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("[Gr33t] Office.addin.hide() not available:", err);
    }
  }, []);

  const handleRefresh = useCallback(() => {
    dispatchToast(
      <Toast>
        <ToastTitle>Données mockées (Jalon 1)</ToastTitle>
      </Toast>,
      { intent: "info", timeout: 2500 }
    );
  }, [dispatchToast]);

  return (
    <>
      <TaskPane
        weekData={mockWeekData}
        selectedDayIndex={selectedDayIndex}
        hoveredFactor={hoveredFactor}
        onSelectDay={handleSelectDay}
        onHoverFactor={handleHoverFactor}
        onClose={handleClose}
        onRefresh={handleRefresh}
      />
      <Toaster toasterId={toasterId} position="bottom" />
    </>
  );
};

export default App;
