import { SelectSearchResultAction, OptimizeSearchResultAction, actions } from "../../../features/search";
import { SearchDispatcher } from "./interface";
import store from "../../../store";

class SearchResultsDispatcherImpl implements SearchDispatcher {
  setSearchResults(results: any[]): void {
    store.dispatch(actions.setSearchResults(results));
  }
  setSearchResultsVisible(visible: boolean): void {
    store.dispatch(actions.setSearchResultsVisible(visible));
  }
  doSelectAllResults(): void {
    store.dispatch(actions.doSelectAllResults());
  }
  doDeselectAllResults(): void {
    store.dispatch(actions.doDeselectAllResults());
  }
  doSelectSearchResults(action: SelectSearchResultAction): void {
    store.dispatch(actions.doSelectSearchResult(action));
  }
  doSelectOptimizeResult(action: OptimizeSearchResultAction): void {
    store.dispatch(actions.doSelectOptimizeResult(action));
  }
}
export default SearchResultsDispatcherImpl;
