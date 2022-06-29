const sql = require("mssql");
const configs = require('../../config');
const path = require('path');
const router = require('express').Router();
const login = require('../login/login_functions');


router.post("/:siteid", async (request, response) => {
    try {
        const siteid = request.params.siteid || request.headers['pin'];
        const headers = request.headers;
        const body = request.body;
        const params = request.params;
        const queryString = request.query;

        const config = configs.find(c => c.privateKeyID === siteid);
        const loginResult = await login.getUserByLogin(config, body.username, body.emailaddress, params.siteid);
        const loginUser =  (loginResult.recordset && loginResult.recordset.length > 0)? loginResult.recordset : null;

        const payload = {
            loginUser:loginUser, params:params, body:body, config: (config ? config.options : false)
        };

        return response.send(payload);
    }
    catch (err) {
        return response.send({error: "an error has occured! ", err:err});
    }
});


module.exports = router;