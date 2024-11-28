import { PageWrapper } from "../../components/wrapper";
import { Suspense, lazy, useState } from "react";
import ConfigGame from "./configGame";
import Loading from "../../components/loading";
import Logo from "../../components/logo";
import type { DataOfflineGame } from "../../interfaces";

const Game = lazy(() => import("../../components/game"));

const OfflinePage = () => {
  const [dataGame, setDataGame] = useState<DataOfflineGame | null>(null);

  /**
   * Si se ha seleccionado la información de jugar offline, se renderiza
   * el componente de Game, el cual se hace de forma Lazy.
   */
  if (dataGame) {
    return (
      <Suspense fallback={<Loading />}>
        <Game {...dataGame} />
      </Suspense>
    );
  }

  /**
   * Por defecto carga el UI de configuración para jugar Offline...
   */
  return (
    <PageWrapper>
      <Logo />
      <ConfigGame handlePlay={(data) => setDataGame(data)} />
    </PageWrapper>
  );
};

export default OfflinePage;
