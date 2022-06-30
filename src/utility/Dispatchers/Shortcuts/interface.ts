export default interface ShortcutsDispatcherInterface {
  KeyPress(key: string): void;
  KeyRelease(key: string): void;
  setInfoVisible(visible: boolean): void;
}
