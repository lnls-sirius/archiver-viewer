export interface AutoUpdate {
  isEnabled(): boolean;
  setEnabled(): void;
  setDisabled(): void;
  toggle(): void;
}
