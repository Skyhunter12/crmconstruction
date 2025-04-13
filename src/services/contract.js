const {Op} = require('sequelize');

async function getContractById(profileId, models, id){
    const {Contract} = models
    try {
        
    const contracts = await Contract.findOne({
        where: {
            id,
            [Op.or]: [
                {ClientId: profileId},
                {ContractorId: profileId}
            ]
        }
    });
    return await contracts
} catch (error) {
    throw new Error(error)
}
}

async function getActiveContracts(profileId, models){
    const {Contract} = models;
    
    const contracts = await Contract.findAll({
        where: {
            [Op.or]: [
                {ClientId: profileId},
                {ContractorId: profileId}
            ],
            status: {
                [Op.ne]: 'terminated'
            }
        }
    });

    return await contracts
};


module.exports = {
    getContractById,
    getActiveContracts
}