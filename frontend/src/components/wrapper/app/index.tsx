import React from "react";
import { Container } from "..";
import { OptionProvider } from "../../../context/optionContext";
import { UserProvider } from "../../../context/userContext";

const AppWrapper = ({ children }: { children: React.ReactNode }) => (
  <OptionProvider>
    <UserProvider>
      <Container>{children}</Container>
    </UserProvider>
  </OptionProvider>
);

export default React.memo(AppWrapper);
