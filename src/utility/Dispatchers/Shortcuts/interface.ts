export default interface ShortcutsDispatcherInterface {
  KeyPress(key: string): void;
  setInfoVisible(visible: boolean): void;
}
