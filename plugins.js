module.exports = (serverless) => {
    const myPlugin = {
      name: 'my-plugin',
      setup(build) {
        // plugin implementation with `serverless` instance access
        console.log('sls custom options', serverless.service.custom);
      },
    };
  
    // an array of plugins must be returned
    return [myPlugin];
  };