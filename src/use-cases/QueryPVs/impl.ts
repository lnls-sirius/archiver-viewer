import QueryPVsInterface from "./interface";
import archInterface from "../../data-access";
import { RequestsDispatcher, StatusDispatcher } from "../../utility/Dispatchers";
import { actions } from "../../features/search";
import store from "../../store";

function checkValidPV(pvMetadata: any): string {
  if (pvMetadata == null) {
    return;
  }
  if (pvMetadata.paused !== "false") {
    console.log("PV", pvMetadata.pvName, "is paused.");
    return;
  }
  if (pvMetadata.scalar !== "true") {
    console.log("PV", pvMetadata.pvName, " is not a scalar value.");
    return;
  }
  return pvMetadata;
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

async function getValidPVs(pvList: string[]): Promise<any[]> {
  const validPVMetadata: string[] = [];
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
        const pv = checkValidPV(pvMetadata);
        if (pv !== null || pv !== undefined) {
          validPVMetadata.push(pv);
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

  await getValidPVs(data).then((pvs) =>
    pvs.forEach((pvMetadata) => {
      if (pvMetadata) {
        validPVsMetadata.push(pvMetadata);
      }
    })
  );

  store.dispatch(actions.setSearchResults(validPVsMetadata));
}

const QueryPVsImpl: QueryPVsInterface = async (search: string): Promise<void> => {
  RequestsDispatcher.IncrementActiveRequests();
  await archInterface
    .query(search)
    .then(async (data) => await filterMetadata(data))
    .then(() => {
      store.dispatch(actions.setSearchResultsVisible(true));
    })
    .catch((e) => {
      const msg = `Failed to search PVs using ${search} ${e}`;
      console.error(`Failed to search PVs using ${search}`, e);
      StatusDispatcher.Error("Query PV: PV validation", msg);
    });

  RequestsDispatcher.DecrementActiveRequests();
};

export default QueryPVsImpl;
