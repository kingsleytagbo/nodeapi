const router = require('express').Router();
const configs = require('../../config');
const authorize = require('../authentication/authorize');
const users = require('./user_functions');



//  http://localhost:3010/api/gallery/FEA91F56-CBE3-4138-8BB6-62F9A5808D57/1
//  https://nodeapi.launchfeatures.com/api/gallery/88B8B45E-2BE7-44CB-BBEA-547BB9A8C7D5/2
// get all users
router.get("/:siteid/page/:pagenum?", async function (request, response) {
    const siteid = request.params.siteid;
    const pageNum = (request.params.pagenum) ? request.params.pagenum : 1;
    const pageSize = 20; 
    const offset = (pageNum - 1) * pageSize;

    const config = configs.find(c => c.privateKeyID === siteid);

    const authResult = await users.getUsers(config, siteid, offset, pageSize);
    const result =  authResult.recordset;

    return response.send(result);
});

// get one user
router.get("/:siteid/:id", async function (request, response) {
    const siteid = request.params.siteid;
    const id = request.params.id;
    const config = configs.find(c => c.privateKeyID === siteid);

    const authResult = await users.getUser(config, siteid, id);
    const result =  authResult.recordset;
    
    return response.send(result);
});

// create a user
router.post("/:siteid", async function (request, response) {
    const siteid = request.params.siteid;
    const id = request.params.id;
    const firstname = request.body.firstname;
    const lastname = request.body.lastname;

    const config = configs.find(c => c.privateKeyID === siteid);

    const authResult = await users.createUser(config, siteid, 
        'username', 'firstname', 'lastname', 'email', 1, 1, 0,
        'password', 1, 1, 1);
    const result =  authResult.recordset;

    return response.send(result);
});

// delete a user
router.delete("/:siteid/:id", async function (request, response) {
    const siteid = request.params.siteid;
    const id = request.params.id;

    const config = configs.find(c => c.privateKeyID === siteid);
    if(id > 1){
        const authResult = await users.deleteUser(config, siteid, id);
        const result =  authResult.recordset;
        return response.send(result);
    }
    else return response.send({'users/delete/a/user': new Date(), id: request.params.id});
});

// update a user
router.put("/:siteid/:id", async function (request, response) {
    const siteid = request.params.siteid;
    const id = request.params.id;
    const firstname = request.body.firstname;
    const lastname = request.body.lastname;

    const config = configs.find(c => c.privateKeyID === siteid);

    const authResult = await users.updateUser(config, siteid, id, firstname, lastname);
    const result =  authResult.recordset;

    return response.send(result);
});

module.exports = router;