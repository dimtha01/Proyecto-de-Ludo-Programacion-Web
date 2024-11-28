import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ROUTES } from "./routerConfig";
import { Suspense, lazy } from "react";
import Loading from "../../components/loading";

const AboutPage = lazy(() => import("../about"));
const LobbyPage = lazy(() => import("../lobby"));
const OfflinePage = lazy(() => import("../offline"));
const OnlinePage = lazy(() => import("../online"));

const Router = () => (
  <Suspense fallback={<Loading />}>
    <BrowserRouter>
      <Routes>
        <Route path="*" element={<LobbyPage />} />
        <Route path={ROUTES.LOBBY} element={<LobbyPage />} />
        <Route path={ROUTES.OFFLINE} element={<OfflinePage />} />
        <Route path={ROUTES.ONLINE} element={<OnlinePage />} />
        <Route path={ROUTES.ABOUT} element={<AboutPage />} />
      </Routes>
    </BrowserRouter>
  </Suspense>
);

export default Router;
