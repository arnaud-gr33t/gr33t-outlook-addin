import * as React from "react";
import { makeStyles, tokens, shorthands } from "@fluentui/react-components";

const useStyles = makeStyles({
  foot: {
    ...shorthands.padding("12px", "16px"),
    textAlign: "center",
    borderTopWidth: "1px",
    borderTopStyle: "solid",
    borderTopColor: tokens.colorNeutralStroke2,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    fontStyle: "italic",
    lineHeight: 1.5,
  },
});

const Footer: React.FC = () => {
  const styles = useStyles();
  return (
    <div className={styles.foot}>
      Ces indicateurs sont définis dans le cadre de la politique QVCT de l&apos;entreprise.
    </div>
  );
};

export default Footer;
