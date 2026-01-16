function getClientEnvironment(publicUrl) {
  const raw = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PUBLIC_URL: publicUrl,
  };

  Object.keys(process.env)
      .filter(key => /^REACT_APP_/i.test(key))
      .forEach(key => {
        raw[key] = process.env[key];
      });

  const stringified = {
    'process.env': Object.keys(raw).reduce((env, key) => {
      env[key] = JSON.stringify(raw[key]);
      return env;
    }, {}),
  };

  return { raw, stringified };
}

module.exports = getClientEnvironment;
