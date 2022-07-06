
const sql = require("mssql");

const UserFunctions = {

    getUsers: async (config, privateKeyID, offset, pageSize) => {
        privateKeyID = privateKeyID ? String(privateKeyID).trim().toLowerCase() : privateKeyID;

        try {
            await sql.connect(config);
            let query = ' SELECT US.*';
            query += ' FROM [ITCC_User] US (NOLOCK) JOIN [ITCC_WebsiteUser] WU (NOLOCK) ';
            query += ' ON (US.ITCC_UserID = WU.ITCC_UserID) ';
            query += ' JOIN [ITCC_Website] WS (NOLOCK) ON (WU.ITCC_WebsiteID = WS.ITCC_WebsiteID) ';
            query +=   ' WHERE ( ' +
            ' ( CONVERT(VARCHAR(38),WS.PrivateKeyID) = ' + "'" + privateKeyID + "'" + ' ) ' +
            ') ';
            query += ' ORDER BY US.UserName Desc ';
            query += ' OFFSET ' + offset + ' ROWS ';
            query += ' FETCH NEXT ' + pageSize + ' ROWS ONLY ';

            // console.log(query);
            const result = await sql.query(query);
            return result;

        } catch (err) {
            //console.log({getUserByLogin: err});
            throw err
        }
    },

    getUser: async (config, privateKeyID, id) => {
        privateKeyID = privateKeyID ? String(privateKeyID).trim().toLowerCase() : privateKeyID;

        try {
            await sql.connect(config);
            let query = ' SELECT US.*';
            query += ' FROM [ITCC_User] US (NOLOCK) JOIN [ITCC_WebsiteUser] WU (NOLOCK) ';
            query += ' ON (US.ITCC_UserID = WU.ITCC_UserID) ';
            query += ' JOIN [ITCC_Website] WS (NOLOCK) ON (WU.ITCC_WebsiteID = WS.ITCC_WebsiteID) ';
            query +=   ' WHERE ( ' +
            ' ( US.ITCC_USERID = @ID ) ' +
            ') ';

            const request = new sql.Request();
            request.input('id', sql.Int, id);
            const result = await request.query(query);
            return result;

        } catch (err) {
            //console.log({getUserByLogin: err});
            throw err
        }
    },

    updateUser: async (config, privateKeyID, id, firstName, lastName) => {
        privateKeyID = privateKeyID ? String(privateKeyID).trim().toLowerCase() : privateKeyID;

        try {
            await sql.connect(config);
            let query = ' UPDATE ITCC_USER SET ';
            query += ' FirstName = @FirstName, LastName = @LastName ';
            query +=   ' WHERE ( ' +
            ' ( ITCC_USERID = @ID ) ' +
            '); SELECT @@ROWCOUNT; ';

            const request = new sql.Request();
            request.input('id', sql.Int, id);
            request.input('FirstName', sql.NVarChar(64), firstName);
            request.input('LastName', sql.NVarChar(128), lastName);
            const result = await request.query(query);
            return result;

        } catch (err) {
            //console.log({getUserByLogin: err});
            throw err
        }
    },
};

module.exports = UserFunctions;