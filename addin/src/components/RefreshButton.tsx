import * as React from "react";
import { makeStyles, tokens, Button, shorthands } from "@fluentui/react-components";
import { ArrowSync20Regular } from "@fluentui/react-icons";

const useStyles = makeStyles({
  wrap: {
    ...shorthands.padding("12px", "16px"),
    borderTopWidth: "1px",
    borderTopStyle: "solid",
    borderTopColor: tokens.colorNeutralStroke2,
  },
  btn: {
    width: "100%",
  },
});

interface RefreshButtonProps {
  onClick: () => void;
}

const RefreshButton: React.FC<RefreshButtonProps> = ({ onClick }) => {
  const styles = useStyles();
  return (
    <div className={styles.wrap}>
      <Button
        appearance="outline"
        icon={<ArrowSync20Regular />}
        onClick={onClick}
        className={styles.btn}
      >
        Actualiser les données mail
      </Button>
    </div>
  );
};

export default RefreshButton;
