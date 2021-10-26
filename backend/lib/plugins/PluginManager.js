const Logger = require("../Logger");

const VALETUDO_PLUGIN_API_LEVEL = 1;

class PluginManager {
    /**
     * @param {object} options
     * @param {import("../Configuration")} options.config
     * @param {import("../core/ValetudoRobot")} options.robot
     * @param {import("../ValetudoEventStore")} options.valetudoEventStore
     */
    constructor(options) {
        this.config = options.config;
        this.robot = options.robot;
        this.eventStore = options.valetudoEventStore;

        this.pluginManagerConfig = this.config.get("pluginManager");
        this.activePlugins = {};

        this.loadPlugins();
    }

    loadPlugins() {
        if (this.pluginManagerConfig.enabled !== true) {
            return;
        }

        this.pluginManagerConfig.plugins.forEach(pluginConfig => {
            this.loadPlugin(pluginConfig);
        });
    }

    loadPlugin(pluginConfig) {
        if (!(pluginConfig.id in this.activePlugins)) {
            try {
                const plugin = require(pluginConfig.file);
                if ("valetudo_plugin_api_level" in plugin && plugin.valetudo_plugin_api_level !== VALETUDO_PLUGIN_API_LEVEL) {
                    throw new Error("API level " + plugin.valetudo_plugin_api_level + " != " + VALETUDO_PLUGIN_API_LEVEL);
                }
                this.initPlugin(plugin);
                this.activePlugins[pluginConfig.id] = plugin;
            } catch (e) {
                Logger.error("Could not load plugin " + pluginConfig.id, e);
            }
        }
    }

    initPlugin(plugin) {
        if ("valetudo_plugin_init" in plugin) {
            plugin.valetudo_plugin_init({
                robot: this.robot,
                config: this.config,
                eventStore: this.eventStore,
                logger: Logger,
                paths: module.paths,
            });
        }
    }

    deinitPlugin(plugin) {
        if ("valetudo_plugin_deinit" in plugin) {
            plugin.valetudo_plugin_deinit();
        }
    }

    shutdown() {
        Object.entries(this.activePlugins).forEach(entry => {
            const [key, value] = entry;
            this.deinitPlugin(value);
            delete this.activePlugins[key];
        });
    }
}

module.exports = PluginManager;
