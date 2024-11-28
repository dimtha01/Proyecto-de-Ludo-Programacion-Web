import "./styles.css";
import { getValueFromCache, savePropierties } from "../../../../utils/storage";
import { PageWrapper } from "../../../../components/wrapper";
import { useState } from "react";
import {
  EColors,
  ROOM_RANGE,
  TYPES_ONLINE_GAMEPLAY,
} from "../../../../utils/constants";
import {
  isAValidRoom,
  randomNumber,
  validateLastValueRoomName,
} from "../../../../utils/helpers";
import Icon from "../../../../components/icon";
import Logo from "../../../../components/logo";
import ProfilePicture from "../../../../components/profilePicture";
import SelectColor from "../../../../components/selectTokenColor";
import SelectNumberPlayers from "../../../../components/selectNumberPlayers";
import swal from "sweetalert";
import type {
  IDataPlayWithFriends,
  TColors,
  TTotalPlayers,
} from "../../../../interfaces";

interface PlayWithFriendsProps {
  handlePlayWithFriends: (data: IDataPlayWithFriends) => void;
}

/**
 * Renderiza el formulario para unirse a una sala...
 * @param param0
 * @returns
 */
const JoinRoom = ({ handlePlayWithFriends }: PlayWithFriendsProps) => {
  const [roomNumber, setRoomNumber] = useState("");

  /**
   * Maneja el ingreso del valor de la sala...
   * @param event
   */
  const handleRoomNumber = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;

    if (isAValidRoom(value) || value === "") {
      setRoomNumber(value);
    }
  };

  /**
   * Se hace el envío del formulario, además se valida que la sala tenga asociado
   * el número de jugadores, lo cual se encuentra en el último digito del nombre de la
   * sala...
   * @param event
   * @returns
   */
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const { isValid, numPlayers } = validateLastValueRoomName(roomNumber);

    if (!isValid) {
      return swal({
        title: "Error",
        text: "The room code is not valid.",
        icon: "error",
        closeOnClickOutside: false,
        closeOnEsc: false,
      });
    }

    handlePlayWithFriends({
      type: TYPES_ONLINE_GAMEPLAY.JOIN_ROOM,
      roomName: roomNumber,
      totalPlayers: numPlayers as TTotalPlayers,
    });
  };

  return (
    <div className="page-with-friends-section">
      <h2>Join a room</h2>
      <form
        onSubmit={handleSubmit}
        className="page-with-friends-form glass-effect"
      >
        <input
          className="page-with-friends-code"
          type="tel"
          placeholder="Room number"
          required
          onChange={handleRoomNumber}
          value={roomNumber}
        />
        <button
          disabled={!(roomNumber.length === ROOM_RANGE)}
          className="button blue page-with-friends-join"
          type="submit"
        >
          Join
        </button>
      </form>
    </div>
  );
};

/**
 * Para la creación de una nueva sala...
 * @param param0
 * @returns
 */
const NewRoom = ({ handlePlayWithFriends }: PlayWithFriendsProps) => {
  /**
   * Guarda el color inicial del token con el que se iniciará,
   * este color lo tendrá el jugador que creo la sala...
   */
  const [initialColor, setInitialColor] = useState<TColors>(
    () => getValueFromCache("colorNewRoom", EColors.RED) as TColors
  );

  /**
   * El número de jugadores que tendrá la sala, se obtiene el valor de
   * localStorage, si no por defecto será dos (2)....
   */
  const [totalPlayers, setTotalPlayers] = useState<TTotalPlayers>(
    () => getValueFromCache("totalNewRoom", 2) as TTotalPlayers
  );

  /**
   * Guarda el total de usuarios seleccioandos, así como guardarlo en
   * localStorage...
   * @param total
   */
  const handleTotalPlayers = (total: TTotalPlayers) => {
    setTotalPlayers(total);
    savePropierties("totalNewRoom", total);
  };

  /**
   * Guarda el color seleccionado del token y se guarda en localStorage...
   * @param color
   */
  const handleColorToken = (color: TColors) => {
    setInitialColor(color);
    savePropierties("colorNewRoom", color);
  };

  /**
   * Para la acción de crear la nueva sala...
   */
  const handleNewRoom = () => {
    /**
     * El rango a obtener será menos 1 ya que el último valor del rango estará reservado
     * para el número de jugadores, esto con el fin de poder extraerlo después...
     */
    const roomRange = ROOM_RANGE - 1;
    const baseRoom = randomNumber(
      10 ** (roomRange - 1),
      10 ** roomRange - 1
    ).toString();

    /**
     * La nueva sala será el valor base aleatorio de la sala que se ha obtenido y se le
     * añade el total de jugadores...
     */
    const newRoom = `${baseRoom}${totalPlayers}`;

    handlePlayWithFriends({
      type: TYPES_ONLINE_GAMEPLAY.CREATE_ROOM,
      roomName: newRoom,
      initialColor,
      totalPlayers,
    });
  };

  return (
    <div className="page-with-friends-section">
      <h2>Or Create a room</h2>
      <div className="page-with-friends-new-room glass-effect">
        <SelectNumberPlayers
          value={totalPlayers}
          numberPlayers={[2, 4]}
          handleSelectTotal={handleTotalPlayers}
        />
        <div className="page-with-friends-new-config">
          <SelectColor
            disabled={false}
            color={initialColor}
            handleColor={handleColorToken}
          />
          <button
            className="button yellow page-with-friends-create"
            onClick={handleNewRoom}
          >
            <Icon type="play" fill="#8b5f00" />
            <span>New room</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const PlayWithFriends = (props: PlayWithFriendsProps) => (
  <PageWrapper rightOption={<ProfilePicture />}>
    <Logo />
    <JoinRoom {...props} />
    <NewRoom {...props} />
  </PageWrapper>
);

export default PlayWithFriends;
