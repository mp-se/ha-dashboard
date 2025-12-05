import { createApp } from 'vue';
import { createPinia } from 'pinia';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/js/bootstrap.bundle.js';
import '@mdi/font/css/materialdesignicons.min.css';
import App from './App.vue';
import HaSwitch from './components/HaSwitch.vue';
import HaBinarySensor from './components/HaBinarySensor.vue';
import HaSensor from './components/HaSensor.vue';
import HaLight from './components/HaLight.vue';
import HaSensorGraph from './components/HaSensorGraph.vue';
import HaEntityList from './components/HaEntityList.vue';
import HaAlarmPanel from './components/HaAlarmPanel.vue';
import HaWeather from './components/HaWeather.vue';
import HaSun from './components/HaSun.vue';
import HaMediaPlayer from './components/HaMediaPlayer.vue';
import HaSelect from './components/HaSelect.vue';
import HaButton from './components/HaButton.vue';
import HaSpacer from './components/HaSpacer.vue';
import HaRowSpacer from './components/HaRowSpacer.vue';
import HaPrinter from './components/HaPrinter.vue';
import HaChip from './components/HaChip.vue';
import HaHeader from './components/HaHeader.vue';
import HaPerson from './components/HaPerson.vue';
import HaEnergy from './components/HaEnergy.vue';
import HaLink from './components/HaLink.vue';
import HaWarning from './components/HaWarning.vue';
import HaError from './components/HaError.vue';
import HaGauge from './components/HaGauge.vue';
import HaGlance from './components/HaGlance.vue';
import HaImage from './components/HaImage.vue';
import HaRoom from './components/HaRoom.vue';
import HaBeerTap from './components/HaBeerTap.vue';
import { registerSW } from 'virtual:pwa-register';

const app = createApp(App);
app.use(createPinia());

// Register HA components globally
app.component('HaSwitch', HaSwitch);
app.component('HaBinarySensor', HaBinarySensor);
app.component('HaSensor', HaSensor);
app.component('HaLight', HaLight);
app.component('HaSensorGraph', HaSensorGraph);
app.component('HaEntityList', HaEntityList);
app.component('HaAlarmPanel', HaAlarmPanel);
app.component('HaWeather', HaWeather);
app.component('HaSun', HaSun);
app.component('HaMediaPlayer', HaMediaPlayer);
app.component('HaSelect', HaSelect);
app.component('HaButton', HaButton);
app.component('HaSpacer', HaSpacer);
app.component('HaRowSpacer', HaRowSpacer);
app.component('HaPrinter', HaPrinter);
app.component('HaChip', HaChip);
app.component('HaHeader', HaHeader);
app.component('HaPerson', HaPerson);
app.component('HaEnergy', HaEnergy);
app.component('HaLink', HaLink);
app.component('HaWarning', HaWarning);
app.component('HaError', HaError);
app.component('HaGauge', HaGauge);
app.component('HaGlance', HaGlance);
app.component('HaImage', HaImage);
app.component('HaRoom', HaRoom);
app.component('HaBeerTap', HaBeerTap);

app.mount('#app');

// Register service worker for PWA updates
registerSW({
  onNeedRefresh() {
    // Notify the app that an update is available
    window.dispatchEvent(new CustomEvent('sw-need-refresh'));
  },
  onOfflineReady() {
    console.log('App is ready for offline use');
  },
});
