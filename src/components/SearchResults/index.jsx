import React, { useState, useEffect } from "react";
import { connect } from "react-redux";
import * as S from "./styled";
import Modal from "../Modal";
import handlers from "../../lib/handlers";
import SearchResult from "../SearchResult";
import {
  doSelectMultipleResults,
  doSelectAllResults,
  doDeselectAllResults,
  setSearchResultsVisible,
} from "../../features/chart/sliceChart";

const mapStateToProps = (state) => {
  return { results: state.chart.searchResults, isVisible: state.chart.isSearchResultsVisible };
};

const mapDispatchToProps = {
  doSelectMultipleResults,
  doSelectAllResults,
  doDeselectAllResults,
  setSearchResultsVisible,
};

const SearchResults = ({ results, doSelectAllResults, doDeselectAllResults, isVisible, setSearchResultsVisible }) => {
  const [isModalVisible, setModalVisible] = useState(isVisible);
  const selectAll = () => doSelectAllResults();
  const deselectAll = () => doDeselectAllResults();
  const setVisible = () => {
    if (isVisible) {
      setModalVisible(false); // Fade out modal fist
      setTimeout(() => setSearchResultsVisible(false), 250); // Destroy component
    } else {
      setSearchResultsVisible(true);
    }
  };
  const plotPVs = () => {
    const selectedPVs = [];
    for (const e in results) {
      if (results[e].isSelected) {
        selectedPVs.push(e);
      }
    }
    handlers.plotSelectedPVs(selectedPVs);
    setVisible();
  };

  useEffect(() => {
    // False modal in/out
    setTimeout(() => setModalVisible(isVisible, 250));
  }, [isVisible]);

  return (
    <>
      {isVisible ? (
        <Modal visible={isModalVisible}>
          <S.Controls>
            <S.ControlsLeft>
              <S.Button $bgH="lightgreen" $fgH="black" $bg="darkgreen" $fg="white" onClick={plotPVs}>
                Ok
              </S.Button>
              <S.Button onClick={selectAll}>Select All</S.Button>
              <S.Button onClick={deselectAll}>Deselect All</S.Button>
            </S.ControlsLeft>
            <div>
              <S.Button $bgH="#ff6961" $fgH="black" $bg="darkred" $fg="white" onClick={setVisible}>
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
                {Object.entries(results).map(([pvName, result], idx) => (
                  <SearchResult {...result} idx={idx} key={pvName} />
                ))}
              </S.TableBody>
            </S.Table>
          </S.TableWrapper>
        </Modal>
      ) : (
        ""
      )}
    </>
  );
};
export default connect(mapStateToProps, mapDispatchToProps)(SearchResults);
