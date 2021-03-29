import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";

import * as S from "./styled";

import Modal from "../Modal";
import handlers from "../../controllers/handlers";
import SearchResult from "../SearchResult";
import { SearchResult as SearchResultData } from "../../features/search";
import { RootState } from "../../reducers";
import { SearchDispatcher } from "../../utility/Dispatchers";

const RenderSearchResultsElements = (results: { [key: string]: SearchResultData }): JSX.Element[] => {
  const elements: JSX.Element[] = [];
  for (const key in results) {
    const result = results[key];
    elements.push(<SearchResult {...result} idx={result.pvName} key={key} />);
  }
  return elements;
};

const SearchResults: React.FC = () => {
  const selectSearchIsVisible = (state: RootState) => state.search.visible;
  const selectSearchResults = (state: RootState) => state.search.results;

  const visible = useSelector(selectSearchIsVisible);
  const results = useSelector(selectSearchResults);

  const [isModalVisible, setModalVisible] = useState(visible);

  const selectAll = () => {
    SearchDispatcher.doSelectAllResults();
  };

  const deselectAll = () => {
    SearchDispatcher.doDeselectAllResults();
  };

  const setVisible = () => {
    if (visible) {
      setModalVisible(false); // Fade out modal fist
      setTimeout(() => {
        SearchDispatcher.setSearchResultsVisible(false);
      }, 250); // Destroy component
    } else {
      SearchDispatcher.setSearchResultsVisible(true);
    }
  };

  const plotPVs = () => {
    const selectedPVs: { name: string; optimize: boolean }[] = [];
    for (const e in results) {
      if (results[e].selected) {
        selectedPVs.push({ name: e, optimize: results[e].optimize });
      }
    }
    handlers.plotSelectedPVs(selectedPVs);
    setVisible();
  };

  useEffect(() => {
    setTimeout(() => setModalVisible(visible), 250);
  }, [visible]);

  return (
    <>
      {visible ? (
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
                  <S.TableHeader>Optimize</S.TableHeader>
                  <S.TableHeader>Name</S.TableHeader>
                  <S.TableHeader>EGU</S.TableHeader>
                  <S.TableHeader>PREC</S.TableHeader>
                  <S.TableHeader>Hostname</S.TableHeader>
                  <S.TableHeader>DBRType</S.TableHeader>
                  <S.TableHeader>Sampling</S.TableHeader>
                  <S.TableHeader>Appliance</S.TableHeader>
                </S.TableRow>
              </S.TableHead>
              <S.TableBody>{RenderSearchResultsElements(results)}</S.TableBody>
            </S.Table>
          </S.TableWrapper>
        </Modal>
      ) : (
        ""
      )}
    </>
  );
};
export default SearchResults;
