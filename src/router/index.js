import Vue from 'vue';
import Router from 'vue-router';
import { pending } from '@/tool/http';

Vue.use(Router);

const routes = [
  // {
  //   path: '/',
  //   name: 'Index',
  //   component:  () => import(/* webpackChunkName: "home" */'@/views/index.vue'),
  // },
  {
    path: '/', // 角色
    name: 'Sub',
    redirect: 'user',
    component: () =>
      import(/* webpackChunkName: "sub" */ '@/views/sub.vue'),
    children: [
      {
        path: 'user', // 用户列表
        name: 'User',
        component: () =>
          import(/* webpackChunkName: "sub" */ '@/views/sub/user.vue'),
      },
      {
        path: 'referrer', // 推荐人列表
        name: 'Referrer',
        component: () =>
          import(/* webpackChunkName: "sub" */ '@/views/sub/referrer.vue'),
      },
      {
        path: 'merchant', // 商户列表
        name: 'Merchant',
        component: () =>
          import(/* webpackChunkName: "sub" */ '@/views/sub/merchant.vue'),
      },
    ]
  },
  {
    path: '/list', // 用户列表
    name: 'List',
    component: () =>
      import(/* webpackChunkName: "list" */ '@/views/list.vue'),
  },
  {
    path: '/details', // 明细
    name: 'Details',
    component: () =>
      import(/* webpackChunkName: "list" */ '@/views/details.vue'),
  },
  {
    path: '*',
    redirect: '/',
  },
]

const router = new Router({
  mode: 'history',
  // scrollBehavior: () => ({ y: 0 }),
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { x: 0, y: 0 };
    }
  },
  routes,
});

// 路由守卫
router.beforeEach((to, from, next) => {
  // 清除上个页面进行中的请求
  if (pending.length > 0) {
    pending.forEach((http) => {
      http.cancel('Canceled');
    });
  }
  next();
  // const whiteList = ['/guide', '/index']
  // const address = localStorage.getItem('address');
  // if (whiteList.includes(to.path) || address) {
  //   next();
  // } else {
  //   next({ path: '/index' });
  // }
});

export default router;
