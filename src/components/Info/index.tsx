import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../reducers";
import { ShortcutsDispatcher } from "../../utility/Dispatchers";
import Modal from "../Modal";
import { SHORTCUTS } from "./shortcutData";
import * as S from "./styled";

interface ShortcutData {
  title: string;
  keys: string;
}

const ShortcutInfo: React.FC<ShortcutData> = ({title, keys}) => {
  return (<S.Item>
      <S.ItemData>{title}</S.ItemData>
      <S.ItemData>{keys}</S.ItemData>
    </S.Item>);
}

function showShortcuts(){
  return Object.entries(SHORTCUTS).map(([item, data]) => (
    <ShortcutInfo title={data.title} keys={data.keys}/>
  ));
}

const Info: React.FC = () => {
  const selectInfoIsVisible = (state: RootState) => state.shortcuts.info;

  const visible = useSelector(selectInfoIsVisible);
  const [isModalVisible, setModalVisible] = useState(visible);

  const setVisible = () => {
    ShortcutsDispatcher.setInfoVisible(false);
  };

  useEffect(() => {
    setTimeout(() => setModalVisible(visible), 250);
  }, [visible]);

  return (
    <>
      {visible ? (
        <Modal visible={isModalVisible}>
          <S.Controls>
            <S.Title>Shortcuts Information</S.Title>
            <div>
              <S.Button $bgH="#ff6961" $fgH="black" $bg="darkred" $fg="white" onClick={setVisible}>
                Cancel
              </S.Button>
            </div>
          </S.Controls>
          <S.InfoWrapper>
            <S.ItemHeader>
              <S.ItemData>Action</S.ItemData>
              <S.ItemData>Shortcut</S.ItemData>
            </S.ItemHeader>
            {showShortcuts()}
          </S.InfoWrapper>
        </Modal>
      ) : (
        ""
      )}
    </>
  );
};
export default Info;
