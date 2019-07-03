# EPICS Archiver Web Interface

A web interface based on [jQuery](https://jquery.com/) and [Chartjs](http://www.chartjs.org/).

## Building
```
npm install
npm run build
```

## Info
https://medium.freecodecamp.org/how-to-use-reactjs-with-webpack-4-babel-7-and-material-design-ff754586f618<br>

* webpack
    - used to configure our new app
* webpack-cli
    - used so that we can use Webpack in the command line
* webpack-dev-server
    - used so that when we make a change to a file inside our new app, we won’t need to refresh the page
* @babel/core
    - this is used to compile ES6 and above into ES5
* @babel/node
    - this is used so that we can import our plugins and packages inside the webpack.config.js rather than require them (it’s just something that I like, and maybe you’ll like it too)
* @babel/preset-env
    - this will determinate which transformations or plugins to use and polyfills (i.e it provides modern functionality on older browsers that do not natively support it) based on the browser matrix you want to support
* @babel/preset-react
    - this is going to compile the React code into ES5 code.
* babel-loader
    - this is a Webpack helper that transforms your JavaScript dependencies with Babel (i.e. will transform the import statements into require ones)
* style-loader
    - this will add to the DOM the styles (will inject a <style> tag inside the HTML file)
* css-loader
    - will let us import CSS files into our project
* sass-loader
    - will let us import SCSS files into our project
* node-sass
    - will compile the SCSS files into normal CSS files
