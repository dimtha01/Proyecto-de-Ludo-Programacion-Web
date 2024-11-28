import { EColors, ROOM_RANGE } from "./constants";
import { Socket } from "socket.io";
import { TColors } from "../interfaces";

/**
 * Validar que el valor de la sala es válido...
 * @param value
 * @param roomRange
 * @returns
 */
export const isAValidRoom = (value: string, roomRange = ROOM_RANGE) => {
  const numRegex = /^[1-9]\d*$/;
  return numRegex.test(value) && value.length === roomRange;
};

/**
 * Valida si el color dado es válido...
 * @param color
 * @returns
 */
export const isValidColor = (color?: TColors) => {
  if (!color) return false;

  const colors = Object.keys(EColors);
  return colors.includes(color);
};

/**
 * Valida si un string es un JSON valido...
 * @param json
 * @returns
 */
export const isValidJson = (json: string): boolean => {
  try {
    JSON.parse(json);
    return true;
  } catch (_) {
    return false;
  }
};

/**
 * Devuleve un número "aleatorio", dado un rango...
 * @param min
 * @param max
 * @returns
 */
export const randomNumber = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * Generar un hash
 * @returns
 */
export const guid = () => {
  const s4 = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  return s4() + "-" + s4() + "-" + s4() + "-" + s4() + "-" + s4();
};

// Verificación de tipo para comprobar si un objeto es de tipo Socket
export const isSocket = (obj: any): obj is Socket => {
  return obj && obj.once !== undefined;
};
