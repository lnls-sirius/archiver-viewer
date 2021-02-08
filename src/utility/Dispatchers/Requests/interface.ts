export default interface RequestsDispatcher {
  IncrementActiveRequests(): void;
  DecrementActiveRequests(): void;
}
