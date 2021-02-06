export interface RequestsState {
  pending: number;
  error: string;
  errorDateString: string;
}

const initialState: RequestsState = {
  pending: 0,
  error: "",
  errorDateString: "",
};
export { initialState };
