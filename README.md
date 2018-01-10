# EPICS Archiver Web Interface

A web interface based on [jQuery](https://jquery.com/) and [Chartjs](http://www.chartjs.org/) . Clone it in your `retrieval` appliance's `webapp/ui/` folder.

## Building

The viewer can be built by using `browserify` and `uglifyjs`, but it requires that external dependencies be installed in the system. By this moment, this is not done automatically, so you must do this 
manually with `npm`:

```
npm install nodejs
npm install jquery-mousewheel
npm install jquery-browserify
npm install chart.js --save
npm install xlsx
npm install file-saver
npm install uglify-js@1
npm install uglify-es -g

```

