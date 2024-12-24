import { computed, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { defineStore } from 'pinia';
import { useLoading } from '@sa/hooks';
import { SetupStoreId } from '@/enum';
import { useRouterPush } from '@/hooks/common/router';
import { fetchGetUserInfo, fetchLogin } from '@/service/api';
import { localStg } from '@/utils/storage';
import { $t } from '@/locales';
import { useRouteStore } from '../route';
import { useTabStore } from '../tab';
import { clearAuthStorage, getToken } from './shared';

export const useAuthStore = defineStore(SetupStoreId.Auth, () => {
  const route = useRoute();
  const router = useRouter();
  const routeStore = useRouteStore();
  const tabStore = useTabStore();
  const { toLogin, redirectFromLogin } = useRouterPush(false);
  const { loading: loginLoading, startLoading, endLoading } = useLoading();

  const token = ref(getToken());

  const userInfo: Api.Auth.UserInfo = reactive({
    userId: '',
    userName: '',
    roles: [],
    buttons: []
  });

  /** is super role in static route */
  const isStaticSuper = computed(() => {
    const { VITE_AUTH_ROUTE_MODE, VITE_STATIC_SUPER_ROLE } = import.meta.env;

    return VITE_AUTH_ROUTE_MODE === 'static' && userInfo.roles.includes(VITE_STATIC_SUPER_ROLE);
  });

  /** Is login */
  const isLogin = computed(() => Boolean(token.value));

  /** Reset auth store */
  async function resetStore() {
    const authStore = useAuthStore();

    clearAuthStorage();

    authStore.$reset();

    if (!route.meta.constant) {
      await toLogin();
    }

    tabStore.cacheTabs();
    routeStore.resetStore();
  }

  /**
   * Login
   *
   * @param userName User name
   * @param password Password
   * @param [redirect=true] Whether to redirect after login. Default is `true`
   */
  async function login(userName: string, password: string, redirect = true) {
    startLoading();

    try {
      const { data } = await fetchLogin(userName, password);
      
      if (data.status === 1) {
        const loginToken = {
          token: data.data.Authorization,
          refreshToken: data.data.Authorization
        };

        // 存储 token
        token.value = loginToken.token;
        localStg.set('token', loginToken.token);

        // 打印 token 以便调试
        console.log('Stored token:', token.value);

        userInfo.userId = data.data.userId;
        userInfo.roles = data.data.permissions || [];
        userInfo.userName = userName;

        await loginByToken(loginToken);

        console.log('Login successful, redirecting to home...');
        router.push('/home');

        window.$notification?.success({
          title: $t('page.login.common.loginSuccess'),
          content: $t('page.login.common.welcomeBack', { userName: userInfo.userName }),
          duration: 4500
        });
      } else {
        window.$message?.error(data.message || '登录失败');
        resetStore();
      }
    } catch (error) {
      console.error('登录失败:', error);
      window.$message?.error('登录失败');
      resetStore();
    }

    endLoading();
  }

  async function loginByToken(loginToken: Api.Auth.LoginToken) {
    // 1. stored in the localStorage, the later requests need it in headers
    localStg.set('token', loginToken.token);
    localStg.set('refreshToken', loginToken.refreshToken);

    // 由于我们已经在 login 函数中设置了用户信息，这里直接返回 true
    token.value = loginToken.token;
    return true;

    // 注释掉获取用户信息的部分，因为已经有了
    // const pass = await getUserInfo();
    // if (pass) {
    //   token.value = loginToken.token;
    //   return true;
    // }
    // return false;
  }

  async function getUserInfo() {
    // 暂时直接返回 true
    return true;

    // const { data: info, error } = await fetchGetUserInfo();
    // if (!error) {
    //   Object.assign(userInfo, info);
    //   return true;
    // }
    // return false;
  }

  async function initUserInfo() {
    const hasToken = getToken();

    if (hasToken) {
      const pass = await getUserInfo();

      if (!pass) {
        resetStore();
      }
    }
  }

  return {
    token,
    userInfo,
    isStaticSuper,
    isLogin,
    loginLoading,
    resetStore,
    login,
    initUserInfo
  };
});
