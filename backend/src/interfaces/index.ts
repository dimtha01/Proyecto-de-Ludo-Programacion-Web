import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { Profile } from "passport";
import { Socket } from "socket.io";
import {
  EActionsBoardGame,
  EBoardColors,
  EColors,
  ENextStepGame,
  ESufixColors,
  SocketErrors,
  TYPES_ONLINE_GAMEPLAY,
} from "../utils/constants";

// Se define  una interfaz que extienda el tipo Socket
export interface CustomSocket
  extends Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any> {
  extraData?: {
    totalPlayers: TTotalPlayers;
    roomName: string;
  };
}

export interface IUser {
  name: string;
  token: string;
  socialType: number;
  socialName: string;
  email?: string;
  photo?: string;
}

export type DoneFunction = (error: any, user?: any) => void;

export interface CallbackData {
  profile: Profile;
  done: DoneFunction;
}

export type CallbackAuth = (data: CallbackData) => void;

export type TTypesOnlineGameplay = keyof typeof TYPES_ONLINE_GAMEPLAY;
export type TDicevalues = 1 | 2 | 3 | 4 | 5 | 6;
export type TTotalPlayers = 2 | 4;
export type TColors = keyof typeof EColors;
export type TSocketErrors = keyof typeof SocketErrors;
export type TBoardColors = keyof typeof EBoardColors;
export type TSufixColors = keyof typeof ESufixColors;
export type TActionsBoardGame = keyof typeof EActionsBoardGame;
export type IENextStepGame = keyof typeof ENextStepGame;

/**
 * Interfaz para las salas que están disponibles en redis...
 */
export interface IAvailableRoomData {
  roomName: string;
  isPrivate: boolean;
}

export type IAvailableRoom = Record<TTotalPlayers, IAvailableRoomData[]>;

export interface IDataSocketUser {
  id: string;
  name: string;
}
export interface IDataSocket {
  type: TTypesOnlineGameplay;
  totalPlayers: TTotalPlayers;
  roomName: string;
  initialColor?: TColors;
  playAsGuest: boolean;
  user: IDataSocketUser;
}

export interface IUserSocket {
  id: string;
  name: string;
  photo?: string;
  socketID: string;
  color: TColors;
  isReady: boolean;
}
export interface IDataRoom {
  initialTurnUserID: string;
  isPrivate: boolean;
  isFull: boolean;
  roomName: string;
  initialColor: TColors;
  colorDistribution: TColors[];
  users: IUserSocket[];
  totalPlayers: TTotalPlayers;
  gameStarted: boolean;
}

export interface ISocketListenSelectToken {
  diceIndex: number;
  tokenIndex: number;
}

export interface ISocketListenChatMessage {
  userID: string;
  message: string;
}

export interface IDoneTokenMovement {
  action: IENextStepGame;
}

export interface ISocketActions {
  type: TActionsBoardGame;
  roomName: string;
  [EActionsBoardGame.ROLL_DICE]: TDicevalues;
  [EActionsBoardGame.SELECT_TOKEN]: ISocketListenSelectToken;
  [EActionsBoardGame.OPPONENT_LEAVE]: string;
  [EActionsBoardGame.CHAT_MESSAGE]: ISocketListenChatMessage;
  [EActionsBoardGame.DONE_DICE]: boolean;
  [EActionsBoardGame.DONE_TOKEN_MOVEMENT]: IDoneTokenMovement;
}
