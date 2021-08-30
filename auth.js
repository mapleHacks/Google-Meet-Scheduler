const jwt = require('jsonwebtoken');

const auth = async(req,res,next)=>{
    if(!req.cookies.jwt) return res.redirect('/');
    try{
        await jwt.verify(req.cookies.jwt,process.env.JWT_SECRET);
        next();
    }
    catch{
        return res.redirect('/');
    }
}

module.exports = auth