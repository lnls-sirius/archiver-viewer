import { DataExportModule } from "./DataExportInterface";

import { utils as XLSXutils, write as XLSXwrite, BookType } from "xlsx";
import { saveAs as FileSaverSaveAs } from "file-saver";
const s2ab = (s: any): ArrayBuffer => {
  const buf = new ArrayBuffer(s.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i !== s.length; ++i) {
    view[i] = s.charCodeAt(i) & 0xff;
  }
  return buf;
};

const asXlsx: DataExportModule = async (datasets) => {
  const bookType: BookType = "xlsx";
  const book = XLSXutils.book_new();

  const sheetInfo: any[] = [];

  datasets.forEach((dataset: any, i: number) => {
    const pvName = dataset.label;
    const metadata = dataset.pv.metadata;

    const dataArray = dataset.data.map((data: any) => {
      return {
        x: data.x.toLocaleString("br-BR") + "." + data.x.getMilliseconds(),
        y: data.y,
      };
    });

    let sheetName = pvName.replace(new RegExp(":", "g"), "_");
    if (sheetName.length > 31) {
      sheetName = (i + 1).toString();
    }
    sheetInfo.push({
      "Sheet Name": sheetName,
      "PV Name": pvName,
      ...metadata,
    });
    XLSXutils.book_append_sheet(book, XLSXutils.json_to_sheet(dataArray), sheetName);
  });

  // Sheet containing PV information.
  XLSXutils.book_append_sheet(book, XLSXutils.json_to_sheet(sheetInfo), "Sheet Info");

  const wbout = XLSXwrite(book, { type: "binary", bookType: bookType });
  try {
    FileSaverSaveAs(new Blob([s2ab(wbout)], { type: "application/octet-stream" }), `export.${bookType}`);
  } catch (e) {
    if (typeof console != "undefined") {
      console.log(e, wbout);
    }
  }
};
export default asXlsx;
