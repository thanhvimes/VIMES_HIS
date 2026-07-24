import { contractsController } from './src/controllers/health-check/contracts.controller';

async function testDirect() {
    const req: any = {
        body: {
            vneid_url: 'https://api-sandbox.emrhub.vn/api',
            vneid_username: '8934285008135_api',
            vneid_password: '******'
        }
    };
    const res: any = {
        json: (data: any) => {
            console.log('✅ TEST CONNECTION RESPONSE:', data);
            return data;
        },
        status: (code: number) => {
            console.log('STATUS:', code);
            return res;
        }
    };

    await contractsController.testConnection(req, res);
    process.exit(0);
}

testDirect();
