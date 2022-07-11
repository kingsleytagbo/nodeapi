const router = require('express').Router();
const configs = require('../../config');
const login = require('./login_functions');


router.post("/:siteid", async (request, response) => {
    try {
        const siteid = request.params.siteid || request.headers['pin'];
        const headers = request.headers;
        const body = request.body;
        const params = request.params;
        const queryString = request.query;

        const config = configs.find(c => c.privateKeyID === siteid);
        const loginResult = await login.getUserByLogin(config, body.username, body.emailaddress, params.siteid);
        const loginUser =  (loginResult.recordset && loginResult.recordset.length > 0)? loginResult.recordset[0] : null;
        if(loginUser && loginUser.AuthID){
            await login.updateUserLoginInfo(config, body.username, body.emailaddress, params.siteid, loginUser.AuthID);
        }
        const payload = loginUser;
        
        return response.send(payload);
    }
    catch (err) {
        return response.send({error: 'an error has occured'});
    }
});


module.exports = router;