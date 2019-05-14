const azure = require("../../utils/azure");

describe('utils/azure', () => {
  it.skip('should successfully login', async () => {
    const creds = await azure.interactiveLogin();
    console.log(creds);
  });

  // it('should return aws config', () => {
    //     const config = aws.getConfig();
    //     expect(config.default).toBeDefined();
    // });

    // it('should return credentials', () => {
    //     const credentials = aws.getCredentials("default");
    //     expect(credentials.aws_access_key_id).toBeDefined();
    //     expect(credentials.aws_secret_access_key).toBeDefined();
    // });

    // it('should return profiles', () => {
    //     const profiles = aws.getProfiles();
    //     console.log(profiles);
    // });
    
});