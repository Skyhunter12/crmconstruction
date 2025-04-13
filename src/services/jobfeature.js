const {Op} = require('sequelize');
const {sequelize, Profile} = require('../model')

async function getUnPaidJobs(profileId, {Contract, Job}) {
    try{
    
    const unpaidJobs = await Job.findAll({
        include: {
            model: Contract,
            where: {
                [Op.or]: [
                    {ClientId: profileId},
                    {ContractorId: profileId}
                ],
                status: 'in_progress' // Only active contracts
            }
        },
        where: {
            paid: null // Unpaid jobs
        }
    });
    return await unpaidJobs
    }catch(err){
        throw new Error(err)
    }
}

async function payForJob(profileId, {Contract, Job, Profile}, job_id) {
    try{
    const job = await Job.findOne({
        where: {id: job_id},
        include: {
            model: Contract,
            where: {ClientId: profileId} // Ensure the client owns the job
        }
    });

    if (!job) throw 'Job not found or not accessible';
    if (job.paid) throw 'Job is already paid';

    const client = await Profile.findOne({where: {id: profileId}});
    const contractor = await Profile.findOne({where: {id: job.Contract.ContractorId}});

    if (client.balance < job.price) {
        throw 'Insufficient balance';
    }

    // Perform the payment transaction
    let paidJobs =await sequelize.transaction(async (t) => {
        client.balance -= job.price;
        contractor.balance += job.price;
        await client.save({transaction: t});
        await contractor.save({transaction: t});
        job.paid = true;
        job.paymentDate = new Date();
        await job.save({transaction: t});
    });

    return paidJobs
    }catch(err){
        throw new Error(err)
    }

}

async function PayBalanceAmount(userId, amount, models) {
    const {Job, Profile, Contract} = models
    
    try{
    const client = await Profile.findOne({where: {id: userId, type: 'client'}});
        if (!client) throw new Error('Client not found');
    
        const unpaidJobs = await Job.findAll({
            include: {
                model: Contract,
                where: {ClientId: userId, status: 'in_progress'}
            },
            where: {paid: null}
        });
    
        const totalUnpaid = unpaidJobs.reduce((sum, job) => sum + job.price, 0);
        const maxDeposit = totalUnpaid * 0.25;
    
        if (amount > maxDeposit) {
            throw new Error(`Deposit exceeds 25% of total unpaid jobs (${maxDeposit})`);
        }
    
        client.balance += amount;
        await client.save();
    }catch(error){
        console.log(error)
        return error
    }
    
}

async function findBestProfession(isoStart, isoEnd, models) {
    const {Job, Profile} = models;
    
    try{
    let bestProfession = await sequelize.query(
        `
        SELECT 
            Profiles.profession, 
            SUM(balance) AS total_earned
        FROM Profiles
       INNER JOIN Contracts ON Contracts.ClientId = Profiles.id
        INNER JOIN Jobs ON Jobs.ContractId = Contracts.id
        WHERE Jobs.paid = 1
        AND Jobs.paymentDate BETWEEN :start AND :end
        GROUP BY Profiles.profession
        ORDER BY total_earned DESC
        LIMIT 1
        `,
        {
            replacements: { start: isoStart, end: isoEnd },
            type: sequelize.QueryTypes.SELECT,
        }
    );
    return await bestProfession
    }catch(err){
        return err
    }

}

async function findBestClients(start, end, limit, models) {

    try {
        const bestClients = await sequelize.query(
            `
            SELECT 
                Profiles.id, 
                Profiles.firstName, 
                Profiles.lastName, 
                SUM(balance) AS total_paid
            FROM Profiles
            INNER JOIN Contracts ON Contracts.ClientId = Profiles.id
            INNER JOIN Jobs ON Jobs.ContractId = Contracts.id
            WHERE Jobs.paid = 1 AND Jobs.paymentDate BETWEEN :start AND :end
            GROUP BY Profiles.id
            ORDER BY total_paid DESC
            LIMIT :limit`,
            {
                replacements: { start: new Date(start).toISOString(), end: new Date(end).toISOString(), limit: parseInt(limit) },
                type: sequelize.QueryTypes.SELECT,
            }
        );

        return await bestClients
    
    } catch (error) {
        return error
    }
}
module.exports={
    getUnPaidJobs,
    payForJob,
    PayBalanceAmount,
    findBestProfession,
    findBestClients
}