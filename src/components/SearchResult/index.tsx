import React from "react";
import { useDispatch } from "react-redux";
import { actions as actionsSearch, SearchResult } from "../../features/search";
import * as S from "./styled";

import Checkbox from "../Checkbox";

interface SearchResultProps extends SearchResult {
  idx: string;
  key: string;
}

const SearchResult: React.FC<SearchResultProps> = (props: SearchResultProps) => {
  const { DBRType, PREC, applianceIdentity, hostName, idx, pvName, samplingPeriod, units, selected } = props;
  const dispatch = useDispatch();
  return (
    <S.TableRow>
      <S.TableData>{idx}</S.TableData>
      <S.TableData>
        <Checkbox
          checked={selected}
          onClick={() => dispatch(actionsSearch.doSelectSearchResult({ selected: !selected, pvName: pvName }))}
        />
      </S.TableData>
      <S.TableData>{pvName}</S.TableData>
      <S.TableData>{units}</S.TableData>
      <S.TableData>{PREC}</S.TableData>
      <S.TableData>{hostName}</S.TableData>
      <S.TableData>{DBRType}</S.TableData>
      <S.TableData>{`${1 / parseFloat(samplingPeriod)} Hz`}</S.TableData>
      <S.TableData>{applianceIdentity}</S.TableData>
    </S.TableRow>
  );
};
export default SearchResult;
