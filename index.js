/**
 * @format
 */

import {AppRegistry} from 'react-native';
import {name as appName} from './app.json';
import App from './src/App';
import { FlatList, ScrollView, SectionList } from "react-native"

FlatList.defaultProps = FlatList.defaultProps || {}
FlatList.defaultProps.removeClippedSubviews = false
ScrollView.defaultProps = ScrollView.defaultProps || {}
ScrollView.defaultProps.removeClippedSubviews = false
SectionList.defaultProps = SectionList.defaultProps || {}
SectionList.defaultProps.removeClippedSubviews = false

AppRegistry.registerComponent(appName, () => App);
