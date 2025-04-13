
const getProfile = async (req, res, next) => {
    const {Profile} = req.app.get('models')
    let firstName = req.headers.firstname;
    const profile = await Profile.findOne({where: {firstName}})
    console.log(profile)
    if(!profile) return res.status(401).end()
    req.profile = profile
    next()
}
module.exports = { getProfile }