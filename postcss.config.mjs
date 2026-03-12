const config = {
  plugins: {
    "@tailwindcss/postcss": {},
    "postcss-preset-env": {
      stage: 2,
      features: {
        'nesting-rules': true,
        'custom-properties': false, // let tailwind handle this if possible or transpile it
        'media-query-ranges': true
      },
      browsers: ['Android >= 11', 'Chrome >= 83', 'Edge >= 80']
    }
  },
};

export default config;
