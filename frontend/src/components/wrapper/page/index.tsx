import "./styles.css";
import BackButton from "../../backButton";
import Options from "../../options";
import React, { ReactNode } from "react";

interface PageWrapperProps {
  children: JSX.Element | JSX.Element[] | ReactNode;
  leftOption?: JSX.Element | null;
  rightOption?: JSX.Element | null;
}

const PageWrapper = ({
  children,
  leftOption = <BackButton />,
  rightOption = <Options />,
}: PageWrapperProps) => (
  <div className="page-wrapper">
    {(leftOption || rightOption) && (
      <div className="page-wrapper-options">
        <div>{leftOption}</div>
        <div>{rightOption}</div>
      </div>
    )}
    {children}
  </div>
);

export default React.memo(PageWrapper);
