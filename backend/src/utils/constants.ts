import { IAvailableRoom } from "../interfaces";

/**
 * El valor del rango para la sala.
 */
export const ROOM_RANGE = 5;

/**
 * Tiempo de vida de una sala...
 */
export const ROOM_TTL = 30 * 60;

/**
 * Llave en redis que contiene la data de las salas disponibles...
 */
export const KEY_AVAILABLE_ROOMS = "AVAILABLE_ROOMS";

/**
 * Valor inicial de las salas que se guardane ne redis...
 */
export const INITIAL_AVAILABLE_ROOMS: IAvailableRoom = { "2": [], "4": [] };

/**
 * Puerto por el cual correrá el server y la API...
 */
export const APP_DEFAULT_PORT = 3000;

/**
 * Tiempo de espera para las promesas se sincronización de juego...
 */
export const TIMEOUT_DELAY_SYNC = 5000;

/**
 * Específica las rutas a nivel de backend del juego...
 */
export enum ROUTES {
  BASE_API = "/api",
  SUCCESS_LOGIN = `${BASE_API}/successlogin`,
  ME = `${BASE_API}/me`,
  LOGOUT = `${BASE_API}/logout`,
}

/**
 * Tipos de jugabilidad online...
 */
export enum TYPES_ONLINE_GAMEPLAY {
  JOIN_EXISTING_ROOM = "JOIN_EXISTING_ROOM",
  JOIN_ROOM = "JOIN_ROOM",
  CREATE_ROOM = "CREATE_ROOM",
}

/**
 * Para el nombre de los colores que se manejan en el board...
 */
export enum EColors {
  RED = "RED",
  BLUE = "BLUE",
  YELLOW = "YELLOW",
  GREEN = "GREEN",
}

/**
 * Los tipos de errores que se pueden presentar en los sockets...
 */
export enum SocketErrors {
  INVALID_ROOM = "INVALID_ROOM",
  INVALID_COLOR = "INVALID_COLOR",
  INVALID_USER = "INVALID_USER",
  UNAUTHENTICATED = "UNAUTHENTICATED",
  AUTHENTICATED = "AUTHENTICATED",
}

export enum EBoardColors {
  RGYB = "RGYB",
  BRGY = "BRGY",
  YBRG = "YBRG",
  GYBR = "GYBR",
}

/**
 * Guarda los sufijos de los colores...
 */
export enum ESufixColors {
  R = "RED",
  B = "BLUE",
  Y = "YELLOW",
  G = "GREEN",
}

export enum EActionsBoardGame {
  "ROLL_DICE" = "ROLL_DICE",
  "SELECT_TOKEN" = "SELECT_TOKEN",
  "OPPONENT_LEAVE" = "OPPONENT_LEAVE",
  "CHAT_MESSAGE" = "CHAT_MESSAGE",
  "DONE_DICE" = "DONE_DICE",
  "DONE_TOKEN_MOVEMENT" = "DONE_TOKEN_MOVEMENT",
}

export enum ENextStepGame {
  "ROLL_DICE_AGAIN" = "ROLL_DICE_AGAIN",
  "MOVE_TOKENS_AGAIN" = "MOVE_TOKENS_AGAIN",
  "NEXT_TURN" = "NEXT_TURN",
}
