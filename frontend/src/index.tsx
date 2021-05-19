import ReactDOM from 'react-dom';
import '@fontsource/roboto';
import reportWebVitals from './reportWebVitals';
import App from './App';
import { initDevelopment } from './development';

if (process.env.NODE_ENV === 'development') {
  initDevelopment();
}

ReactDOM.render(<App />, document.getElementById('root'));

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
