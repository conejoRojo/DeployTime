const { app } = require('electron');

console.log('Test: App loaded:', app);

app.on('ready', () => {
  console.log('Test: App is ready!');
  app.quit();
});
