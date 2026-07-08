import healthCheckController from './src/controllers/health-check/health-check.controller';

async function test() {
    const req: any = {
        body: {
            startDate: '',
            endDate: '',
            workplaceId: ''
        }
    };
    const res: any = {
        status: function(code: number) {
            console.log("Status set to:", code);
            return this;
        },
        json: function(data: any) {
            console.log("JSON response:", JSON.stringify(data));
            return this;
        }
    };
    
    console.log("Calling seedFromHis...");
    try {
        await healthCheckController.seedFromHis(req, res);
    } catch (err) {
        console.error("Crash during seedFromHis execution:", err);
    }
}

test().then(() => process.exit(0));
