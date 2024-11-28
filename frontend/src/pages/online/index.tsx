import { guid, randomNumber } from "../../utils/helpers";
import { IDataSocket } from "../../interfaces";
import { TYPES_ONLINE_GAMEPLAY } from "../../utils/constants";
import { useGetRoomURL } from "../../hooks";
import { useCallback, useState } from "react";
import { useUserContext } from "../../context/userContext";
import {
  Authenticate,
  Matchmaking,
  PlayWithFriends,
  TotalPlayers,
} from "./components";

const OnlinePage = () => {
  /**
   * Extrae la información del contenxto para el usuario...
   */
  const { isAuth = false, authOptions = [], user } = useUserContext();

  /**
   * Para indicar si muestra la UI de crear una nueva sala...
   */
  const [playWithFriends, setPlayWithFriends] = useState(false);

  /**
   * Guarda la información que será enviada al socket...
   * Si existe el usuario por que está autenticado, se envía
   * si no existe se genera un usuario aleatorio que será usado
   * para jugar como invitado...
   */
  const [dataSocket, setDataSocket] = useState<IDataSocket>({
    type: TYPES_ONLINE_GAMEPLAY.NONE,
    totalPlayers: 0,
    playAsGuest: false,
    roomName: "",
    user: {
      id: user?.id || guid(),
      name: user?.name || `Player ${randomNumber(1000, 9999)}`,
    },
  });

  /**
   * Hook que lee si existe el valor de la sala en la url, si es es así
   * retorna la información que permite que el usuario se una a la sala,
   * se pasa el valor para saber si está auténticado, ya que sólo
   * usuarios que los estém podrán entrar a la sala....
   */
  useGetRoomURL(
    isAuth,
    useCallback((data) => {
      /**
       * Se establece la data para unirse a la sala, con los datos devueltos por el hook...
       */
      setDataSocket((current) => ({ ...current, ...data }));
    }, [])
  );

  /**
   * Mostrar los botones de autenticación...
   */
  if (!isAuth && !dataSocket.playAsGuest) {
    return (
      <Authenticate
        authOptions={authOptions}
        handlePlayGuest={() => {
          setDataSocket({ ...dataSocket, playAsGuest: true });
        }}
      />
    );
  }

  /**
   * Muestra la opción de seleccionar el número de usuarios a jugar...
   */
  if (dataSocket.totalPlayers === 0 && !playWithFriends) {
    return (
      <TotalPlayers
        playAsGuest={dataSocket.playAsGuest}
        handlePlayWithFriends={() => setPlayWithFriends(true)}
        handleTotalPlayers={(total) => {
          setDataSocket({
            ...dataSocket,
            type: TYPES_ONLINE_GAMEPLAY.JOIN_EXISTING_ROOM,
            totalPlayers: total,
          });
        }}
      />
    );
  }

  /**
   * Muestra la UI para crear o unirse a una sala...
   */
  if (playWithFriends && !dataSocket.roomName) {
    return (
      <PlayWithFriends
        handlePlayWithFriends={(data) =>
          setDataSocket({ ...dataSocket, ...data })
        }
      />
    );
  }

  /**
   * Componente que muestra la pantalla para realizar el proceso de conectarse con otros
   * jugadores...
   */
  return <Matchmaking dataSocket={dataSocket} />;
};

export default OnlinePage;
