const EGU_EQUIVALENTS: { [index: string]: string } = {
  MBAR: "mBar",
  mBar: "mBar",
  volt: "V",
  Volt: "V",
  v: "V",
};

const eguNormalize = (egu: string, pvName: string): string => {
  let newEgu: string;

  if (egu === undefined || egu === "") {
    newEgu = pvName;
  } else {
    newEgu = egu;
  }

  newEgu = newEgu.replace("?", "o");
  if (egu in EGU_EQUIVALENTS) {
    return EGU_EQUIVALENTS[newEgu];
  }
  return newEgu;
};
export { eguNormalize };
