import React from "react";
import * as S from "./styled";
import { SearchResult } from "../../features/search";
import { SearchDispatcher } from "../../utility/Dispatchers";
import Checkbox from "../Checkbox";

interface SearchResultProps extends SearchResult {
  idx: string;
  key: string;
  selected: boolean;
  optimize: boolean;
  diff: boolean;
  pvName: string;
}

const SearchResult: React.FC<SearchResultProps> = (props: SearchResultProps) => {
  const { DBRType, PREC, applianceIdentity, hostName, idx, pvName, samplingPeriod, EGU, selected, optimize, diff} = props;
  const sampleFrequency = 1 / samplingPeriod;
  return (
    <S.TableRow>
      <S.TableData>{idx}</S.TableData>
      <S.TableData>
        <Checkbox
          checked={selected}
          onClick={() => SearchDispatcher.doSelectSearchResults({ selected: !selected, pvName: pvName })}
        />
      </S.TableData>
      <S.TableData>
        <Checkbox
          checked={optimize}
          onClick={() => SearchDispatcher.doSelectOptimizeResult({ optimize: !optimize, pvName: pvName })}
        />
      </S.TableData>
      <S.TableData>
        <Checkbox
          checked={diff}
          onClick={() => SearchDispatcher.doSelectDiffResult({ diff: !diff, pvName: pvName })}
        />
      </S.TableData>
      <S.TableData>{pvName}</S.TableData>
      <S.TableData>{EGU}</S.TableData>
      <S.TableData>{PREC}</S.TableData>
      <S.TableData>{hostName}</S.TableData>
      <S.TableData>{DBRType}</S.TableData>
      <S.TableData>{`${sampleFrequency} Hz`}</S.TableData>
      <S.TableData>{applianceIdentity}</S.TableData>
    </S.TableRow>
  );
};
export default SearchResult;
