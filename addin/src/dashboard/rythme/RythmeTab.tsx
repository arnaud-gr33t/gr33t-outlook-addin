import * as React from "react";
import styles from "./RythmeTab.module.css";
import { useDashboardData } from "./data/data-provider";
import { Timeline } from "./components/Timeline/Timeline";
import { IraCard } from "./components/Ira/IraCard";
import { LeviersStack } from "./components/Leviers/LeviersStack";
import { ConseilPanel } from "./components/Conseil/ConseilPanel";
import {
  AnnotationMarker,
  BubblesArea,
  useCrossHover,
} from "./components/Annotations/Annotations";
import { useAnnotations } from "./hooks/useAnnotations";

/**
 * Onglet "Mon rythme" — assemble :
 *   rhythm-top    : Timeline + annotations (marqueurs + bulles) + légende
 *   rhythm-bottom : IRA (1fr) | Leviers (2.2fr) | ConseilPanel (1.7fr)
 */
export const RythmeTab: React.FC = () => {
  const data = useDashboardData();
  const { mode, selectedId, toggle, reset, selected } = useAnnotations(
    data.annotations
  );
  const { hoveredId, onHoverChange } = useCrossHover();

  return (
    <div>
      <Timeline
        weeks={data.weeks}
        markerSlot={(date) => {
          const annot = data.annotations.find((a) => a.targetDate === date);
          if (!annot) return null;
          return (
            <AnnotationMarker
              annotation={annot}
              isActive={selectedId === annot.id}
              isCrossHighlighted={hoveredId === annot.id}
              onClick={toggle}
              onHoverChange={onHoverChange}
            />
          );
        }}
        annotationsSlot={
          <BubblesArea
            annotations={data.annotations}
            mode={mode}
            selectedId={selectedId}
            onSelect={toggle}
            onClose={reset}
            hoveredId={hoveredId}
            onHoverChange={onHoverChange}
          />
        }
      />

      <div className={styles.rhythmBottom}>
        <IraCard ira={data.ira} />
        <LeviersStack leviers={data.leviers} />
        <ConseilPanel annotation={selected} />
      </div>
    </div>
  );
};
