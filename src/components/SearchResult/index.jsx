import React from "react";
import { connect } from "react-redux";
import { doSelectSearchResult } from "../../features/chart/sliceChart";
import * as S from "./styled";

import Checkbox from "../Checkbox";
const mapDispatchToProps = { doSelectSearchResult };

const SearchResult = ({
  DBRType,
  PREC,
  applianceIdentity,
  creationTime,
  hostName,
  idx,
  pvName,
  samplingPeriod,
  units,
  doSelectSearchResult,
  isSelected,
}) => {
  return (
    <S.TableRow>
      <S.TableData>{idx}</S.TableData>
      <S.TableData>
        <Checkbox
          checked={isSelected}
          onClick={() => doSelectSearchResult({ isSelected: !isSelected, pvName: pvName })}
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
export default connect(null, mapDispatchToProps)(SearchResult);
