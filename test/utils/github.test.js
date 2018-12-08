const github = require("../../utils/github");

describe('github', () => {
    describe('getRepository', () => {
        it('should return repository when found', async () => {
            const repo = await github.getRepository(null, "https://github.com/stevemao/left-pad");
            expect(repo).toBeDefined();

        });
    
        it('should return null when not found', async () => {
            const repo = await github.getRepository(null, "https://github.com/stevemao/left-pad-unknown");
            expect(repo).toBeNull();
        });
    });

    // describe.only('getOrgs', () => {
    //     it('should return list of orgs', async () => {
    //         const orgs = await github.getOrgs();
    //         console.log(orgs)
    //     });
    // });
    
});