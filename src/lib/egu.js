const EGU_EQUIVALENTS = {
  MBAR: "mBar",
  mBar: "mBar",
  volt: "V",
  Volt: "V",
  v: "V",
};

const eguNormalize = (egu, pvName) => {
  if (egu === undefined || egu === "") {
    egu = pvName;
  }
  egu = egu.replace("?", "o");
  if (egu in EGU_EQUIVALENTS) {
    return EGU_EQUIVALENTS[egu];
  } else {
    return egu;
  }
};
export { eguNormalize };
