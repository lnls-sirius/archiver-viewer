export default interface StatusDispatcherInterface {
  Info(title: string, message: string): void;
  Error(title: string, message: string): void;
  Warning(title: string, message: string): void;
}
