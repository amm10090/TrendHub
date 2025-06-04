export default {
  plugins: {
    "@tailwindcss/postcss": {
      at: {
        // 启用所有 @ 指令
        rules: {
          plugin: true,
          source: true,
          utility: true,
          "custom-variant": true,
          apply: true,
          theme: true,
          screen: true,
        },
      },
    },
  },
};
