import QueryPVsInterface from "./interface";
import archInterface from "../../data-access";
import { RequestsDispatcher, StatusDispatcher, SearchDispatcher } from "../../utility/Dispatchers";
import control from "../../entities/Chart";
import { ArchiverMetadata } from "../../data-access/interface";

function isValidPVMetadata(pvMetadata: ArchiverMetadata): boolean {
  if (pvMetadata == null) {
    return false;
  }
  if (pvMetadata.paused) {
    console.log("PV", pvMetadata.pvName, "is paused.");
    return false;
  }
  if (!pvMetadata.scalar) {
    console.log("PV", pvMetadata.pvName, " is not a scalar value.");
    return false;
  }
  return true;
}

function isPromisseFulfilled(result: any): boolean {
  if (!result) {
    console.log(result);
    return false;
  }
  if (result.status !== "fulfilled" || result.value === null || result.value === undefined) {
    return false;
  }
  return true;
}

async function getValidPVs(pvList: string[]): Promise<ArchiverMetadata[]> {
  const validPVMetadata: ArchiverMetadata[] = [];
  const promisses = pvList.map((x) => {
    return archInterface.fetchMetadata(x);
  });
  await Promise.allSettled(promisses)
    .then((results: any[]) => {
      results.forEach((result) => {
        if (!isPromisseFulfilled(result)) {
          return;
        }

        const pvMetadata = result.value;
        if (isValidPVMetadata(pvMetadata)) {
          validPVMetadata.push(pvMetadata);
        }
      });
    })
    .finally(function () {
      console.log("Valid PVs: ", validPVMetadata.length);
    });
  return validPVMetadata;
}

async function filterMetadata(data: string[]): Promise<void> {
  const validPVsMetadata: any[] = [];

  await getValidPVs(data).then((pvsMeta) =>
    pvsMeta.forEach((metadata) => {
      if (metadata) {
        const shouldOptimize = control.shouldOptimizeRequest(metadata.samplingPeriod, metadata.DBRType);
        validPVsMetadata.push({ ...metadata, optimize: shouldOptimize > 0 }); // @todo: Fixme! Enforce type safety
      }
    })
  );
  SearchDispatcher.setSearchResults(validPVsMetadata);
}

const QueryPVsImpl: QueryPVsInterface = async (search: string): Promise<void> => {
  RequestsDispatcher.IncrementActiveRequests();
  await archInterface
    .query(search)
    .then(async (data) => await filterMetadata(data))
    .then(() => {
      SearchDispatcher.setSearchResultsVisible(true);
    })
    .catch((e) => {
      const msg = `Failed to search PVs using ${search} ${e}`;
      console.error(msg, e);
      StatusDispatcher.Error("Query PV", msg);
    });

  RequestsDispatcher.DecrementActiveRequests();
};

export default QueryPVsImpl;
