---
title: Troubleshooting
category: Misc
order: 34
---
# Troubleshooting

## Logging
### Log Level

Valetudo's log level can be set in the UI. It is not persisted across restarts. If you need to permanently set a log level, adjust it in the valetudo config file.

### MQTT

If you want to debug MQTT, you can set the `DEBUG` environment variable to `mqttjs*` (refer to the [MQTT.js README](https://github.com/mqttjs/MQTT.js#debug-logs)).
