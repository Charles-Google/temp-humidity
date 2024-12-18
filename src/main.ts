import { createApp } from 'vue';
import './plugins/assets';
import ElementPlus from 'element-plus';
import { setupAppVersionNotification, setupDayjs, setupIconifyOffline, setupLoading, setupNProgress } from './plugins';
import { setupStore } from './store';
import { setupRouter } from './router';
import { setupI18n } from './locales';
import 'element-plus/dist/index.css';
import 'element-plus/theme-chalk/dark/css-vars.css'
import App from './App.vue';

async function setupApp() {
  setupLoading();

  setupNProgress();

  setupIconifyOffline();

  setupDayjs();

  const app = createApp(App);

  setupStore(app);

  await setupRouter(app);

  setupI18n(app);

  setupAppVersionNotification();
  app.use(ElementPlus);
  app.mount('#app');
}

setupApp();
