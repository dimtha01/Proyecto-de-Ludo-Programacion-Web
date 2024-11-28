import { Token } from "..";
import React from "react";
import type {
  IDiceList,
  IListTokens,
  ISelectTokenValues,
} from "../../../../interfaces";

interface TokensProps {
  diceList: IDiceList[];
  listTokens: IListTokens[];
  isDisabledUI?: boolean;
  debug?: boolean;
  handleSelectedToken: (selectTokenValues: ISelectTokenValues) => void;
}

/**
 * Componente que renderiza el listado de tokens en el bpard...
 * @param param0
 * @returns
 */
const Tokens = ({
  listTokens,
  diceList,
  isDisabledUI = false,
  debug = false,
  handleSelectedToken,
}: TokensProps) => (
  <React.Fragment>
    {listTokens.map(({ index, tokens }) => (
      <React.Fragment key={index}>
        {tokens.map((token) => (
          <Token
            {...token}
            diceList={diceList}
            debug={debug}
            isDisabledUI={isDisabledUI}
            key={token.index}
            handleSelectedToken={handleSelectedToken}
          />
        ))}
      </React.Fragment>
    ))}
  </React.Fragment>
);

export default React.memo(Tokens);
