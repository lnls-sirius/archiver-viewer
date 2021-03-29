import { SelectSearchResultAction, OptimizeSearchResultAction } from "../../../features/search";

export interface SearchDispatcher {
  doDeselectAllResults(): void;
  doSelectAllResults(): void;
  doSelectOptimizeResult(action: OptimizeSearchResultAction): void;
  doSelectSearchResults(action: SelectSearchResultAction): void;
  setSearchResults(results: any[]): void;
  setSearchResultsVisible(visible: boolean): void;
}
