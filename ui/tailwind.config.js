module.exports = {
  future: {
    removeDeprecatedGapUtilities: true,
    purgeLayersByDefault: true
  },
  purge: ["./src/**/*.vue"],
  theme: {
    extend: {}
  },
  variants: {},
  plugins: [require("@tailwindcss/custom-forms")]
};
