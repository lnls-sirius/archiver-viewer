import { SelectSearchResultAction, OptimizeSearchResultAction, DriftSearchResultAction } from "../../../features/search";

export interface SearchDispatcher {
  doDeselectAllResults(): void;
  doSelectAllResults(): void;
  doSelectOptimizeResult(action: OptimizeSearchResultAction): void;
  doSelectDriftResult(action: DriftSearchResultAction): void;
  doSelectSearchResults(action: SelectSearchResultAction): void;
  setSearchResults(results: any[]): void;
  setSearchResultsVisible(visible: boolean): void;
}
