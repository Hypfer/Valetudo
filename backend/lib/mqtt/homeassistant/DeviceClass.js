/**
 * Retrieved from https://github.com/home-assistant/core/blob/8b1cfbc46cc79e676f75dfa4da097a2e47375b6f/homeassistant/components/sensor/const.py#L64-L416 on 2023-10-25.
 *
 * See also https://developers.home-assistant.io/docs/core/entity/#generic-properties
 *
 * @enum {string}
 */
const DeviceClass = Object.freeze({
    DATE: "date",
    ENUM: "enum",
    TIMESTAMP: "timestamp",
    APPARENT_POWER: "apparent_power",
    AQI: "aqi",
    ATMOSPHERIC_PRESSURE: "atmospheric_pressure",
    BATTERY: "battery",
    CO: "carbon_monoxide",
    CO2: "carbon_dioxide",
    CURRENT: "current",
    DATA_RATE: "data_rate",
    DATA_SIZE: "data_size",
    DISTANCE: "distance",
    DURATION: "duration",
    ENERGY: "energy",
    ENERGY_STORAGE: "energy_storage",
    FREQUENCY: "frequency",
    GAS: "gas",
    HUMIDITY: "humidity",
    ILLUMINANCE: "illuminance",
    IRRADIANCE: "irradiance",
    MOISTURE: "moisture",
    MONETARY: "monetary",
    NITROGEN_DIOXIDE: "nitrogen_dioxide",
    NITROGEN_MONOXIDE: "nitrogen_monoxide",
    NITROUS_OXIDE: "nitrous_oxide",
    OZONE: "ozone",
    PH: "ph",
    PM1: "pm1",
    PM10: "pm10",
    PM25: "pm25",
    POWER_FACTOR: "power_factor",
    POWER: "power",
    PRECIPITATION: "precipitation",
    PRECIPITATION_INTENSITY: "precipitation_intensity",
    PRESSURE: "pressure",
    REACTIVE_POWER: "reactive_power",
    SIGNAL_STRENGTH: "signal_strength",
    SOUND_PRESSURE: "sound_pressure",
    SPEED: "speed",
    SULPHUR_DIOXIDE: "sulphur_dioxide",
    TEMPERATURE: "temperature",
    VOLATILE_ORGANIC_COMPOUNDS: "volatile_organic_compounds",
    VOLATILE_ORGANIC_COMPOUNDS_PARTS: "volatile_organic_compounds_parts",
    VOLTAGE: "voltage",
    VOLUME: "volume",
    VOLUME_STORAGE: "volume_storage",
    WATER: "water",
    WEIGHT: "weight",
    WIND_SPEED: "wind_speed"
});

module.exports = DeviceClass;
