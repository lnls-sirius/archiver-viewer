import React, { useState } from "react";

import * as S from "./styled";
import * as St from "../SearchResults/styled";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faListOl } from "@fortawesome/free-solid-svg-icons";
import { useSelector } from "react-redux";

import { DatasetInfo } from "../../entities/Chart/ChartJS";
import { RootState } from "../../reducers";
import ChartController from "../../controllers/Chart";
import chart from "../../entities/Chart";

import Checkbox from "../Checkbox";
import Modal from "../Modal";
import { AlarmName, ArchiverDataPoint, SeverityColor, SeverityName } from "../../data-access/interface";

const Entries: React.FC = () => {
  const datasets = useSelector(({ chart: { datasets } }: RootState) => datasets);

  const optimizeHandler = async (label: string, optimize: boolean) => {
    await ChartController.setDatasetOptimized(label, optimize);
  };
  const diffHandler = async (label: string, diff: boolean) => {
    await ChartController.setDatasetDiff(label, diff);
  };
  const removeDataset = async (name: string) => {
    await ChartController.removeDataset(name);
  };
  const hideDataset = (name: string) => {
    ChartController.hideDataset(name);
  };

  function EntryLine(datasetInfo: DatasetInfo) {
    const {
      label,
      yAxisID,
      backgroundColor,
      visible,
      pv: { optimized, diff, bins },
    } = datasetInfo;

    return (
      <S.EntryGroup key={label}>
        <S.Color title="Dataset visibility" $bgcolor={backgroundColor} onClick={() => hideDataset(label)}>
          {visible ? <S.VisibleIndicator /> : <S.HiddenIndicator />}
        </S.Color>
        <S.Text title="PV name">{label}</S.Text>
        <S.EguText title="y axis label">{yAxisID}</S.EguText>
        <Checkbox
          onClick={() => diffHandler(label, !diff)}
          checked={diff}
          text="Diff?"
          tooltip="Check if you want the data differentiated based on the reference time"
        />
        <Checkbox
          onClick={() => optimizeHandler(label, !optimized)}
          checked={optimized}
          text="Optimize?"
          tooltip="Uncheck if you want raw data from the server"
        />
        {optimized ? <a title="Number of points when optimizing">{bins}</a> : null}
        <S.ButtonRed title="Remove dataset" onClick={() => removeDataset(label)}>
          Remove
        </S.ButtonRed>
        <DataPreview />
      </S.EntryGroup>
    );

    function DataPreview() {
      const [visible, setVisible] = useState(false);
      const DisplayModal = () => {
        if (!visible) {
          return <></>;
        }

        return (
          <Modal visible bgOnClick={() => setVisible(false)}>
            {RenderDataset({ label, setVisible })}
          </Modal>
        );
      };
      return (
        <>
          <S.Button title="View Data" onClick={() => setVisible(true)}>
            <FontAwesomeIcon icon={faListOl}></FontAwesomeIcon>
          </S.Button>
          <DisplayModal />
        </>
      );
    }
  }

  return <S.EntriesWrapper>{datasets.map((info) => EntryLine(info))}</S.EntriesWrapper>;
};
export default Entries;

function RenderDataset({
  label,
  setVisible,
}: {
  label: string;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const dataset = GetDataset(label);
  const {
    pv: {
      egu,
      optimized,
      diff,
      metadata: { DBRType },
    },
  } = dataset.metadata;
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          margin: "2rem",
        }}
      >
        <span style={{ fontSize: "1.5rem", fontWeight: 700 }}>{label}</span>
        <span style={{ fontSize: "1.1rem", fontWeight: 500 }}>{egu}</span>
        <span style={{ fontSize: "1.1rem", fontWeight: 500 }}>{diff ? "Diff" : ""}</span>
        <span style={{ fontSize: "1.1rem", fontWeight: 500 }}>{optimized ? "Optimized" : ""}</span>
        <span style={{ fontSize: "1.1rem", fontWeight: 500 }}>{DBRType}</span>
        <S.ButtonRed style={{ padding: "1.2rem" }} onClick={() => setVisible(false)}>
          Fechar
        </S.ButtonRed>
      </div>
      <div style={{ height: "calc(100% - 8rem)", overflow: "auto" }}>
        {RenderDatasetTable(dataset.metadata, dataset.data)}
      </div>
    </div>
  );
}

function RenderDatasetTable(info: DatasetInfo, data: ArchiverDataPoint[]) {
  return (
    <St.Table>
      <St.TableHead>
        <St.TableRow>
          <St.TableHeader>Timestamp</St.TableHeader>
          <St.TableHeader>Value</St.TableHeader>
          <St.TableHeader>Severity</St.TableHeader>
          <St.TableHeader>Status</St.TableHeader>
        </St.TableRow>
      </St.TableHead>
      <St.TableBody>{RenderDatasetRows(info, data)}</St.TableBody>
    </St.Table>
  );
}

function GetDataset(label: string) {
  const _candidates = chart.getDatasets().filter((d) => d.metadata.label == label);
  return _candidates[0];
}

function RenderDatasetRows(
  {
    pv: {
      precision,
      metadata: { DBRType },
    },
  }: DatasetInfo,
  data: ArchiverDataPoint[]
) {
  const precMin = 1 / 10 ** precision;
  const precMax = 10 ** precision;

  return (
    <>
      {data.map(({ x, y, severity, status }) => {
        const fmt =
          !precision || (DBRType != "DBR_SCALAR_DOUBLE" && DBRType != "DBR_SCALAR_FLOAT")
            ? y
            : y > precMax || y < precMin || y < precMin * 10 || y > precMax / 10
            ? y.toExponential(precision)
            : y.toFixed(precision);
        return (
          <St.TableRow key={x.valueOf()} $bg={SeverityColor(severity)}>
            <St.TableData>{x.toLocaleString()}</St.TableData>
            <St.TableData>{fmt}</St.TableData>
            <St.TableData>{SeverityName(severity)}</St.TableData>
            <St.TableData>{AlarmName(status)}</St.TableData>
          </St.TableRow>
        );
      })}
    </>
  );
}
