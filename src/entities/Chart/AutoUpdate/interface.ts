export default interface AutoUpdateInterface {
  isEnabled(): boolean;
  setEnabled(): void;
  setDisabled(): void;
  toggle(): void;
}
