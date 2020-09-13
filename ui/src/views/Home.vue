<template>
  <div class="flex flex-col items-center h-screen">
    <img class="w-32 m-4" alt="Valetudo logo" src="../assets/logo.png" />
    <ul>
      <li v-for="server in servers" :key="server">
        <router-link :to="server" class="text-blue-500">
          Connect to {{ server }}
        </router-link>
      </li>
    </ul>
    <span class="line w-full">
      <svg
        class="inline w-10 text-green-400"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
        />
      </svg>
    </span>
    <form class="flex flex-col w-full" @submit="connect(hostname)">
      <label class="block m-2">
        <span class="text-gray-700">IP / Hostname</span>
        <input
          v-model="hostname"
          class="form-input mt-1 block w-full"
          type="text"
        />
      </label>
      <input
        class="m-2 ml-auto bg-green-400 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        type="submit"
        value="Add &amp; Connect"
      />
    </form>
  </div>
</template>

<script>
export default {
  name: "Home",
  data() {
    return {
      servers: JSON.parse(localStorage.getItem("servers")) || [],
      hostname: ""
    };
  },
  methods: {
    connect(hostname) {
      console.log("connect");
      const servers = JSON.parse(localStorage.getItem("servers")) || []; // TODO: replace this by IndexedDB
      servers.push(hostname);
      localStorage.setItem("servers", JSON.stringify(servers));
      this.$router.push(hostname);
    }
  }
};
</script>

<style scoped>
.line {
  text-align: center;
}
.line::after,
.line::before {
  @apply bg-gray-500;
  content: "";
  display: inline-block;
  height: 1px;
  position: relative;
  vertical-align: middle;
  width: 50%;
}

.line:before {
  right: 0.5em;
  margin-left: -50%;
}

.line:after {
  left: 0.5em;
  margin-right: -50%;
}
</style>
