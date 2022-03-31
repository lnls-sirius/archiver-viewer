import { ArchiverMetadata } from "../../data-access/interface";

export interface SearchResult extends ArchiverMetadata {
  selected: boolean;
  optimize: boolean;
  diff: boolean;
}
export interface SearchStateInterface {
  visible: boolean;
  results: { [key: string]: SearchResult };
}
export const initialState: SearchStateInterface = {
  visible: false,
  results: {},
};
