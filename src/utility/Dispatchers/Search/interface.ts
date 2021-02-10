import { SelectSearchResultAction } from "../../../features/search";

export interface SearchDispatcher {
  setSearchResults(results: any[]): void;
  setSearchResultsVisible(visible: boolean): void;
  doSelectAllResults(): void;
  doDeselectAllResults(): void;
  doSelectSearchResults(action: SelectSearchResultAction): void;
}
