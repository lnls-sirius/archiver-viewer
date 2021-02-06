const showWarning = () => $("#obs").fadeIn().delay(5000).fadeOut();
const hideWarning = () => $("#obs").fadeOut();

const showSearchWarning = () => {
  $("#warning").fadeIn();
};

const hideSearchWarning = () => {
  $("#warning").fadeOut();
};

const toggleSearchWarning = function (warning) {
  $("#warning h4").text(warning);

  showSearchWarning();

  const timer = setInterval(function () {
    hideSearchWarning();
    clearInterval(timer);
  }, 5000);
};

export default {
  showWarning: showWarning,
  hideWarning: hideWarning,
  showSearchWarning: showSearchWarning,
  hideSearchWarning: hideSearchWarning,
  toggleSearchWarning: toggleSearchWarning,
};
