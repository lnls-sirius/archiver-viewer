export interface SearchResult {
  DBRType: string;
  PREC: string;
  applianceIdentity: string;
  creationTime: string;
  hostName: string;
  isSelected: string;
  pvName: string;
  samplingPeriod: string;
  selected: boolean;
  units: string;
}
export interface SearchStateInterface {
  visible: boolean;
  results: { [key: string]: SearchResult };
}
export const initialState: SearchStateInterface = {
  visible: false,
  results: {},
};
