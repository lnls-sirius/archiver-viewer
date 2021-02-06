export interface StackUndoInterface {
  undoRemovePV(): void;
  undoAppendPV(): void;
  undoChangeWindowTime(): void;
  undoChangeEndTime(): void;
  undoChangeStartTime(): void;
  undoZoom(): void;
}

export interface StackRedoInterface {
  doRemovePV(): void;
  doAppendPV(): void;
  doChangeWindowTime(): void;
  doChangeEndTime(): void;
  doChangeStartTime(): void;
  doZoom(): void;
}

export interface ActionPayloadInterface {}

interface ActionsStackInterface {
  getUndoHandler(): StackUndoInterface;
  getRedoHandler(): StackRedoInterface;
}
export default ActionsStackInterface;
