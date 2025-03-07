import { ROOM_RANGE } from "./constants";

export const $ = document.querySelector.bind(document);
export const $$ = document.querySelectorAll.bind(document);

export const isMobile = (): boolean =>
  /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

export const debounce = (fn: Function, delay: number) => {
  var t: number;
  return function () {
    clearTimeout(t);
    t = setTimeout(fn, delay);
  };
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
 * Copiar un texto en el portapapeles...
 * @param {*} text
 */
export const copyToClipboard = (text: string = "") => {
  navigator.clipboard.writeText(text);
};

/**
 * Establece una interrupción...
 * @param ms
 * @returns
 */
export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

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
 * Valida que un valor dado sea un número...
 * @param value
 * @returns
 */
export const isNumber = (value: any): value is number =>
  typeof value === "number" && !isNaN(value);

/**
 * Generar un hash, útil para tokens.
 * @returns
 */
export const guid = () => {
  const s4 = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  return s4() + "-" + s4() + "-" + s4() + "-" + s4() + "-" + s4();
};

/**
 * Limpiar un string de tags...
 * @param input
 * @returns
 */
export const sanizateTags = (input: string) =>
  input ? input.replace(/<\/?[^>]+(>|$)/g, "") : "";

/**
 * Valida si el valor de una sala en la jugabilidad online es valida
 * @param value
 * @param roomRange
 * @returns
 */
export const isAValidRoom = (value: string, roomRange = ROOM_RANGE) => {
  const numRegex = /^[1-9]\d*$/;
  return numRegex.test(value) && value.length <= roomRange;
};

/**
 * Función que valida que el último digito de la sala contenga el valor
 * del total de jugadores...
 * @param value
 * @returns
 */
export const validateLastValueRoomName = (value: string) => {
  let isValid = false;
  let lastValue = value.at(-1);
  let numPlayers = 0;

  if (lastValue) {
    numPlayers = +lastValue;
    isValid = [2, 4].includes(+lastValue);
  }

  return { isValid, numPlayers };
};

/**
 * Helper que indica si se está en el ambiente de desarrollo...
 * @returns
 */
export const isDev = () => process.env.NODE_ENV === "development";
