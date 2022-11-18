import Vue from 'vue';
import VueRouter from 'vue-router';
import Home from '../page/Home.vue';
import Profile from '../page/Profile.vue';

Vue.use(VueRouter);

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/address/:address',
    name: 'Profile',
    component: Profile,
  },
];

const router = new VueRouter({
  base: '/w3box.w3q/',
  routes,
});

export default router;
