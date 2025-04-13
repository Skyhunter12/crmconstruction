const express = require('express');
const bodyParser = require('body-parser');
const {sequelize} = require('./model')
const {getProfile} = require('./middleware/getProfile')
const {Op} = require('sequelize');
const { getContractById, getActiveContracts } = require('./services/contract');
const { getUnPaidJobs, payForJob, PayBalanceAmount, findBestProfession, bestClients, findBestClients } = require('./services/jobfeature');
const app = express();
app.use(bodyParser.json());
app.set('sequelize', sequelize)
app.set('models', sequelize.models)
// sequelize.sync({ alter: true });

app.get('/contracts/:id',getProfile ,async (req, res) =>{
    const {Contract} = req.app.get('models')
    const {id} = req.params
    const profileId = req.profile.id;
    
    let contract =await getContractById(profileId, {Contract}, id)
    console.log("model",contract)
    if(!contract) return res.status(404).end()
    res.json(contract)
})

app.get('/contracts', getProfile, async (req, res) => {
    const profileId = req.profile.id;

    let contracts = await getActiveContracts(profileId, req.app.get('models'))
    res.json(contracts);
});

app.get('/jobs/unpaid', getProfile, async (req, res) => {
    const profileId = req.profile.id;

    let unpaidJobs = await getUnPaidJobs(profileId, req.app.get('models'))

    res.json(unpaidJobs);
});

// 4. POST /jobs/:job_id/pay - Pay for a job
app.post('/jobs/:job_id/pay', getProfile, async (req, res) => {
    const {job_id} = req.params;
    const profileId = req.profile.id;
    try{
    const paidJob = await payForJob(profileId,req.app.get('models'), job_id)
    console.log(paidJob)
    res.json(paidJob)
    }catch(err){
        console.log(err)
        res.status(500).json({
            'message':'Network error. We are working on it',
            'errors':err})
    }
})

// 5. POST /balances/deposit/:userId - Deposit money into a client's balance
app.post('/balances/deposit/:userId', async (req, res) => {
    const {userId} = req.params;
    const {amount} = req.body;
    console.log(userId, amount)
    try{
    let client = await PayBalanceAmount(userId, amount, req.app.get('models'))
    console.log(client)
    res.json({message: 'Deposit successful', balance: client.balance});
    }catch(err){
        res.status(500).json({
            'message':'Network error. We are working on it',
            'errors':err})
    }
});

// 6. GET /admin/best-profession?start=<date>&end=<date> - Returns the profession that earned the most money
app.get('/admin/best-profession', async (req, res) => {
    const {start, end} = req.query;
    console.log(start,  end);
    let isoStart = new Date(start);
    let isoEnd = new Date(end)
    const bestProfession = await findBestProfession(isoStart, isoEnd, req.app.get('models'))
    if (!bestProfession) return res.status(404).json({error: 'No data found for the given range'});

    res.json(bestProfession);
});

app.get('/admin/best-clients', async (req, res) => {
    const {start, end, limit = 2} = req.query; // Default limit is 2 if not provided

    let bestClients = await findBestClients(start, end, limit,req.app.get('models'))
    if (!bestClients || bestClients.length === 0) {
        return res.status(404).json({ error: 'No data found for the given range' });
    }

    res.json(bestClients);
});
module.exports = app;
