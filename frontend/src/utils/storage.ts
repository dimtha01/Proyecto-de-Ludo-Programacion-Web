import { isValidJson } from "./helpers";

const CACHE_KEY = "LUDO_REACT_GAME";

type IStorageType = "localStorage" | "sessionStorage";

/**
 * Guarda la información en caché (session o localstorage)...
 * @param data
 * @param storageType
 */
export const saveCache = <T>(
  data: T,
  storageType: IStorageType = "localStorage"
) => {
  const finalData = JSON.stringify(data);
  window[storageType].setItem(CACHE_KEY, finalData);
};

/**
 * Obtener la data que está guardarda en localStorage/sessionStorage
 * @param storageType
 * @returns
 */
export const getDataCache = (storageType: IStorageType = "localStorage") => {
  const data = window[storageType].getItem(CACHE_KEY) || "";
  return data !== "" && isValidJson(data) ? JSON.parse(data) : {};
};

/**
 * Guarda valores de una propiedad en localstorage
 * @param property
 * @param value
 * @param storageType
 */
export const savePropierties = <T>(
  property: string,
  value: T,
  storageType: IStorageType = "localStorage"
) => {
  const localCache = getDataCache(storageType);
  localCache[property] = value;
  saveCache(localCache, storageType);
};

/**
 * Guarda múltiples llaves al mismo tiempo...
 * @param data
 * @param storageType
 */
export const saveMultiplePropierties = <T>(
  data: Record<string, T>,
  storageType: IStorageType = "localStorage"
) => {
  for (let key in data) {
    savePropierties(key, data[key], storageType);
  }
};

/**
 * Dada una propiedad, devuelve la información de la misma
 * @param key
 * @param initial
 * @param storageType
 * @returns
 */
export const getValueFromCache = <T>(
  key: string = "",
  initial: T,
  storageType: IStorageType = "localStorage"
) => {
  const localCache = getDataCache(storageType);
  return localCache[key] || initial;
};

/**
 * Eliminar una llave de localStorage...
 * @param property
 * @param storageType
 */
export const deleteProperty = (
  property: string,
  storageType: IStorageType = "localStorage"
) => {
  const localCache = getDataCache(storageType);

  if (localCache[property]) {
    delete localCache[property];
  }

  saveCache(localCache, storageType);
};
