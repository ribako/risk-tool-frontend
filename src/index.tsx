import * as React from 'react';
import * as ReactDOM from 'react-dom';
import Tool from './Tool';
import registerServiceWorker from './registerServiceWorker';
import 'bootstrap/dist/css/bootstrap.css';

ReactDOM.render(
  <Tool />,
  document.getElementById('root') as HTMLElement
);
registerServiceWorker();
