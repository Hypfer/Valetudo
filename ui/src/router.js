import Vue from "vue";
import Router from "vue-router";
import Home from "./views/Home.vue";
import Robot from "./views/Robot.vue";

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: "/",
      name: "home",
      component: Home
    },
    {
      path: "/:hostname(.*)",
      name: "robot",
      component: Robot,
      props: true
    }
  ]
});
