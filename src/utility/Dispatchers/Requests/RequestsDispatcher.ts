export default interface RequestsDispatcher {
  Error(message: string, error?: any): void;
  Warning(message: string, error?: any): void;
  IncrementActiveRequests(): void;
  DecrementActiveRequests(): void;
}
