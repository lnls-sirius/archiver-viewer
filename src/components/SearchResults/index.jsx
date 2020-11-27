import React, { useState } from "react";
import { connect } from "react-redux";
import * as S from "./styled";
import Modal from "../Modal";
import Checkbox from "../Checkbox";
import handlers from "../../lib/handlers";

const mapStateToProps = (state) => {
  return { results: state.chart.searchResults };
};
const SearchResult = ({
  hostName,
  samplingPeriod,
  DBRType,
  creationTime,
  PREC,
  units,
  pvName,
  applianceIdentity,
  idx,
}) => {
  const [selected, setSelected] = useState(false);
  return (
    <S.TableRow>
      <S.TableData>{idx}</S.TableData>
      <S.TableData>
        <Checkbox
          checked={selected}
          onClick={() => {
            setSelected(!selected);
          }}
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

const SearchResults = ({ results }) => {
  const [visible, setVisible] = useState(true);
  const [renderModal, setRenderModal] = useState(true);
  return (
    <>
      {renderModal ? (
        <Modal visible={visible}>
          <S.Controls>
            <S.ControlsLeft>
              <S.Button $bgH="lightgreen" $fgH="black" $bg="darkgreen" $fg="white">
                Ok
              </S.Button>
              <S.Button>Select All</S.Button>
              <S.Button>Deselect All</S.Button>
            </S.ControlsLeft>
            <div>
              <S.Button $bgH="#ff6961" $fgH="black" $bg="darkred" $fg="white">
                Cancel
              </S.Button>
            </div>
          </S.Controls>
          <S.TableWrapper>
            <S.Table>
              <S.TableHead>
                <S.TableRow>
                  <S.TableHeader>n</S.TableHeader>
                  <S.TableHeader>Select</S.TableHeader>
                  <S.TableHeader>Name</S.TableHeader>
                  <S.TableHeader>EGU</S.TableHeader>
                  <S.TableHeader>PREC</S.TableHeader>
                  <S.TableHeader>Hostname</S.TableHeader>
                  <S.TableHeader>DBRType</S.TableHeader>
                  <S.TableHeader>Sampling</S.TableHeader>
                  <S.TableHeader>Appliance</S.TableHeader>
                </S.TableRow>
              </S.TableHead>
              <S.TableBody>
                {results.map((result, idx) => (
                  <SearchResult {...result} idx={idx} key={idx} />
                ))}
              </S.TableBody>
            </S.Table>
          </S.TableWrapper>
          <button
            onClick={() => {
              setTimeout(() => setRenderModal(!visible), 300);
              setVisible(!visible);
            }}
          >
            Toggle
          </button>
        </Modal>
      ) : (
        ""
      )}
      <button
        onClick={() => {
          setTimeout(() => setRenderModal(!visible), 300);
          setVisible(!visible);
        }}
      >
        Toggle
      </button>
    </>
  );
};
export default connect(mapStateToProps)(SearchResults);
