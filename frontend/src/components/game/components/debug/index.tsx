import "./styles.css";
import { copyToClipboard } from "../../../../utils/helpers";
import { ETypeGame, SIZE_TILE } from "../../../../utils/constants";
import {
  LIST_TYPE_TILE,
  TOptions,
  TSelects,
  getOptionsSelects,
  validateChangeToken,
} from "./helpers";
import {
  POSITION_ELEMENTS_BOARD,
  POSITION_TILES,
} from "../../../../utils/positions-board";
import React, { useState } from "react";
import type {
  IActionsTurn,
  ICoordinate,
  IListTokens,
  IPlayer,
  TDicevalues,
  TPositionGame,
  TTypeGame,
  ThandleSelectDice,
} from "../../../../interfaces";

/**
 * Renderiza el tile en el Board...
 * @param param0
 * @returns
 */
const TileElement = ({
  coordinate,
  children,
}: {
  coordinate: ICoordinate;
  children: any;
}) => (
  <div
    className="game-debug-tile"
    style={{
      left: coordinate.x,
      top: coordinate.y,
      width: SIZE_TILE,
      height: SIZE_TILE,
    }}
  >
    {children}
  </div>
);

/**
 * Componente que renderizará los tiles en el board,
 * para así poder saber su posición...
 * @returns
 */
const Tiles = () => (
  <React.Fragment>
    {Object.keys(POSITION_ELEMENTS_BOARD).map((v, index) => {
      const data = POSITION_ELEMENTS_BOARD[v as TPositionGame];

      return (
        <React.Fragment key={index}>
          {/* Celdas de salida */}
          {data.exitTiles.map(({ index, coordinate }) => (
            <TileElement key={index} coordinate={coordinate}>
              {index}
            </TileElement>
          ))}
          {/* Celdas en la carcél */}
          {data.startPositions.map(({ index, coordinate }) => (
            <TileElement key={index} coordinate={coordinate}>
              {index}
            </TileElement>
          ))}
          {/* Celdas finales, sale del board */}
          {data.finalPositions.map(({ index, coordinate }) => (
            <TileElement key={index} coordinate={coordinate}>
              {index}
            </TileElement>
          ))}
        </React.Fragment>
      );
    })}
    {/* Renderiza las celdas regulares del juego */}
    {POSITION_TILES.map(({ index, coordinate }) => (
      <TileElement key={index} coordinate={coordinate}>
        {index}
      </TileElement>
    ))}
  </React.Fragment>
);

interface SelectProps {
  value: number | string;
  title: string;
  options?: { id: string | number; label: string | number }[];
  disabled?: boolean;
  onChange: (value: number | string) => void;
}

/**
 * Para los selects que se mostrarán en el comonente DEBUG...
 * @param param0
 * @returns
 */
const Select = ({
  value,
  title,
  options = [],
  disabled = false,
  onChange,
}: SelectProps) => (
  <select
    value={value}
    disabled={disabled}
    onChange={(event) => onChange(event.target.value)}
  >
    <option value="">{title}</option>
    {options.map(({ id, label }) => (
      <option key={id} value={id}>
        {label}
      </option>
    ))}
  </select>
);

interface DebugTokensProps {
  players: IPlayer[];
  listTokens: IListTokens[];
  actionsTurn: IActionsTurn;
  typeGame: TTypeGame;
  handleSelectDice: ThandleSelectDice;
  setListTokens: React.Dispatch<React.SetStateAction<IListTokens[]>>;
}

/**
 * Renderiza los elementos helpers que ayudará a crear escenarios de los tokens
 * @param param0
 * @returns
 */
const Tokens = ({
  players,
  listTokens,
  actionsTurn,
  typeGame = ETypeGame.OFFLINE,
  setListTokens,
  handleSelectDice,
}: DebugTokensProps) => {
  const [selects, setSelects] = useState<TSelects>({
    player: -1,
    token: -1,
    type: -1,
    position: -1,
  });

  /**
   * Función que cambia el estado para las diferentes opciones del componente....
   * @param value
   * @param type
   */
  const handleSelect = (value: number, type: TOptions) => {
    const copySelects = { ...selects };
    copySelects[type as TOptions] = value;

    if (type === "player") {
      copySelects.token = -1;
      copySelects.type = -1;
      copySelects.position = -1;
    }

    if (type === "token") {
      const { typeTile, positionTile } =
        listTokens[copySelects.player].tokens[value];

      copySelects.type = LIST_TYPE_TILE.findIndex((v) => v === typeTile);
      copySelects.position = positionTile;
    }

    if (type === "type") {
      copySelects.position = -1;
    }

    /**
     * Sí es donde se selecciona la posición donde se desea el token,
     * se realizará la acción de mutar el estado de los mismos...
     */
    if (type === "position") {
      validateChangeToken({ selects: copySelects, listTokens, setListTokens });
    }

    setSelects(copySelects);
  };

  /**
   * Función que copia el estado de los tokens en el portapapeles...
   */
  const handleCopyState = () => {
    copyToClipboard(JSON.stringify(listTokens));
  };

  /**
   * Genera la información de las opciones de los select, dependiendo
   * de los valores que se hayan seleccionado...
   */
  const options = getOptionsSelects(selects, players, listTokens);

  return (
    <div className="game-debug-tokens">
      <div className="game-debug-dice">
        {new Array(6).fill(null).map((_, index) => (
          <button
            key={index}
            disabled={actionsTurn.disabledDice}
            onClick={() => handleSelectDice((index + 1) as TDicevalues, false)}
          >
            {index + 1}
          </button>
        ))}
      </div>
      {/* Sólo se muestran las opciones de mover tokens en la jugabilidad offline */}
      {typeGame === ETypeGame.OFFLINE && (
        <React.Fragment>
          <div className="game-debug-selects">
            {Object.keys(selects).map((select) => {
              const selectType = select as TOptions;

              return (
                <Select
                  key={selectType}
                  value={selects[selectType]}
                  disabled={options[selectType].length === 0}
                  title={selectType.toUpperCase()}
                  options={options[selectType]}
                  onChange={(value) => handleSelect(+value, selectType)}
                />
              );
            })}
          </div>
          <div className="game-debug-copy">
            <button disabled={selects.position < 0} onClick={handleCopyState}>
              COPY STATE
            </button>
          </div>
        </React.Fragment>
      )}
    </div>
  );
};

const Debug = { Tiles, Tokens };

export default Debug;
