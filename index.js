/**
 * App entry point. The name passed to registerComponent must match the
 * "name" field in app.json and the string in MainActivity.getMainComponentName.
 */
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
