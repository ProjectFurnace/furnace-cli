const aws = require("../../utils/aws");

describe('aws', () => {
    it('should return aws config', () => {
        const config = aws.getConfig();
        expect(config.default).toBeDefined();
    });

    it('should return credentials', () => {
        const credentials = aws.getCredentials("default");
        expect(credentials.aws_access_key_id).toBeDefined();
        expect(credentials.aws_secret_access_key).toBeDefined();
    });

    it.only('should return profiles', () => {
        const profiles = aws.getProfiles();
        console.log(profiles);
    });
    
});