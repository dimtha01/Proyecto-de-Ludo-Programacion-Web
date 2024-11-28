import { AppWrapper } from "./components/wrapper";
import React from "react";
import Router from "./pages/router";

const App = () => (
  <AppWrapper>
    <Router />
  </AppWrapper>
);

export default React.memo(App);
