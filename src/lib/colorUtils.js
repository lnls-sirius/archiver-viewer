const colorStack = [
  "rgba(255, 0, 0, 1.0)",
  "rgba(0, 255, 0, 1.0)",
  "rgba(0, 0, 255, 1.0)",
  "rgba(255, 10, 0, 1.0)",
  "rgba(10, 255, 0, 1.0)",
  "rgba(10, 10, 255, 1.0)",
  "rgba(245, 130, 48, 1.0)",
  "rgba(145, 30, 180, 1.0)",
  "rgba(70, 240, 240, 1.0)",
  "rgba(240, 50, 230 ,1.0)",
  "rgba(210, 245, 60, 1.0)",
  "rgba(250, 190, 190, 1.0)",
  "rgba(0, 128, 128, 1.0)",
  "rgba(230, 190, 255, 1.0)",
  "rgba(170, 110, 40, 1.0)",
  "rgba(128, 0, 0, 1.0)",
  "rgba(170, 255, 195, 1.0)",
  "rgba(255, 225, 25, 1.0)",
  "rgba(0, 130, 200, 1.0)",
  "rgba(128, 128, 128, 1.0)",
  "rgba(0, 0, 0, 1.0)",
  "rgba(230, 25, 75, 1.0)",
  "rgba(60, 180, 75, 1.0)",
  "rgba(0, 0, 128, 1.0)",
];

const randomColorGenerator = function () {
  return "#" + (Math.random().toString(16) + "0000000").slice(2, 8);
};
export { colorStack, randomColorGenerator };
