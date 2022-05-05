import { SelectSearchResultAction, OptimizeSearchResultAction, DiffSearchResultAction } from "../../../features/search";

export interface SearchDispatcher {
  doDeselectAllResults(): void;
  doSelectAllResults(): void;
  doSelectOptimizeResult(action: OptimizeSearchResultAction): void;
  doSelectDiffResult(action: DiffSearchResultAction): void;
  doSelectSearchResults(action: SelectSearchResultAction): void;
  setSearchResults(results: any[]): void;
  setSearchResultsVisible(visible: boolean): void;
}
