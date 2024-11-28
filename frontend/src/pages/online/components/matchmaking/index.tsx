import { PageWrapper } from "../../../../components/wrapper";
import { PlayersInfo, RoomInfo } from "./components";
import { Suspense, lazy } from "react";
import { useSocket } from "../../../../hooks";
import BackButton from "../../../../components/backButton";
import Loading from "../../../../components/loading";
import Logo from "../../../../components/logo";
import ProfilePicture from "../../../../components/profilePicture";
import type { IDataSocket } from "../../../../interfaces";

const Game = lazy(() => import("../../../../components/game"));

const Matchmaking = ({ dataSocket }: { dataSocket: IDataSocket }) => {
  /**
   * Custom hook que maneja la información para el match de usuarios,
   * así como la generación de la data para el componente Game...
   */
  const { dataRoomSocket, dataOnlineGame } = useSocket(dataSocket);

  /**
   * Si no existe data del socket, se muestra un cargador...
   */
  if (!dataRoomSocket) {
    return <Loading />;
  }

  /**
   * Se valida que exista datos del juego y que se muestre el componete, después de
   * la interrupción, se usa suspense ya que este componente es "pesado", así que sólo
   * se carga cuando es necesario...
   */
  if (dataOnlineGame) {
    return (
      <Suspense fallback={<Loading />}>
        <Game {...dataOnlineGame} />
      </Suspense>
    );
  }

  return (
    <PageWrapper
      leftOption={<BackButton withConfirmation />}
      rightOption={<ProfilePicture />}
    >
      {dataSocket.roomName ? (
        <RoomInfo roomName={dataSocket.roomName} />
      ) : (
        <Logo />
      )}
      <PlayersInfo dataRoomSocket={dataRoomSocket} />
    </PageWrapper>
  );
};

export default Matchmaking;
