import * as React from "react";
import { makeStyles, tokens } from "@fluentui/react-components";
import type { WeekData, FactorType } from "../types";
import Header from "./Header";
import WeekSelector from "./WeekSelector";
import Timeline from "./Timeline";
import FactorList from "./FactorList";
import RefreshButton from "./RefreshButton";
import TrendChart from "./TrendChart";
import Footer from "./Footer";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    width: "100%",
    backgroundColor: tokens.colorNeutralBackground1,
    overflowY: "auto",
  },
});

interface TaskPaneProps {
  weekData: WeekData;
  selectedDayIndex: number;
  hoveredFactor: FactorType | null;
  onSelectDay: (index: number) => void;
  onHoverFactor: (type: FactorType | null) => void;
  onClose: () => void;
  onRefresh: () => void;
}

/**
 * Layout principal du TaskPane Gr33t.
 * Ordre des sections (conforme à mockup-D.html) :
 * Header → WeekSelector → Timeline → FactorList → RefreshButton → TrendChart → Footer
 */
const TaskPane: React.FC<TaskPaneProps> = ({
  weekData,
  selectedDayIndex,
  hoveredFactor,
  onSelectDay,
  onHoverFactor,
  onClose,
  onRefresh,
}) => {
  const styles = useStyles();
  const currentDay = weekData[selectedDayIndex];

  return (
    <div className={styles.root}>
      <Header day={currentDay.score} onClose={onClose} />
      <WeekSelector
        weekData={weekData}
        selectedIndex={selectedDayIndex}
        onSelect={onSelectDay}
      />
      <Timeline timeline={currentDay.timeline} hoveredFactor={hoveredFactor} />
      <FactorList
        factors={currentDay.score.factors}
        onHoverFactor={onHoverFactor}
      />
      <RefreshButton onClick={onRefresh} />
      <TrendChart />
      <Footer />
    </div>
  );
};

export default TaskPane;
