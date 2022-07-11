
const sql = require("mssql");

const LoginFunctions = {

    getUserByLogin: async (config, username, password, privateKeyID) => {
        privateKeyID = privateKeyID ? String(privateKeyID).trim().toLowerCase() : privateKeyID;
        username = username ? String(username).trim().toLowerCase() : username;
        password = password ? String(password).trim() : password;

        try {
            await sql.connect(config);
            const roleQuery = ' RoleName = STUFF( ( ' +
            '    SELECT  ' + "'" + ','  + "'" + ' + R.Name ' + ' FROM ITCC_Role R(NOLOCK) JOIN ITCC_UserRole UR (NOLOCK) ON (R.ITCC_RoleID = UR.ITCC_RoleID) ' +
            '                JOIN ITCC_Website W1 (NOLOCK) ON (UR.ITCC_WebsiteID = W1.ITCC_WebsiteID) ' +
            '    WHERE ( (UR.ITCC_UserID = WU.ITCC_UserID) AND (W1.PrivateKeyID = ' + "'" + privateKeyID + "'" + ' ) ) ' +
            '    FOR XML PATH(' + "''" + ') ) ' + ' ,1,1, ' + " '') ";
            let query = ' SELECT US.UserToken, ISNULL(US.LastLoginDate, GETDATE()) AS LastLoginDate, ';
            query += ' DATEDIFF(mi, ISNULL(US.LastLoginDate, GETDATE()), GETDATE()) AS TimeDiffMin, NewID() AS AuthID ';
            query += ' ,WU.ITCC_WebsiteID ,US.ITCC_UserID, WS.Title AS WebsiteName, US.UserName' ;
            query += ' , ' + roleQuery;

            query += ' FROM [ITCC_User] US (NOLOCK) JOIN [ITCC_WebsiteUser] WU (NOLOCK) ';
            query += ' ON (US.ITCC_UserID = WU.ITCC_UserID) ';
            query += ' JOIN [ITCC_Website] WS (NOLOCK) ON (WU.ITCC_WebsiteID = WS.ITCC_WebsiteID) ';
            query +=   ' WHERE ( ' +
            ' (RTRIM(LTRIM(LOWER(US.UserName))) = ' + "'" + username + "'" + ' ) AND (RTRIM(LTRIM(US.Password)) = ' + "'" + password + "'" + ') ' +
            ' AND (WS.PrivateKeyID = ' + "'" + privateKeyID + "'" + ' ) ' +
            ') ';

            const result = await sql.query(query);
            return result;

        } catch (err) {
            console.log({getUserByLogin: err});
            //throw err
        }
    },

    updateUserLoginInfo: async (config, username, password, privateKeyID, authID) => {
        privateKeyID = privateKeyID ? String(privateKeyID).trim().toLowerCase() : privateKeyID;
        username = username ? String(username).trim().toLowerCase() : username;
        password = password ? String(password).trim() : password;

        try {
            await sql.connect(config);
            let query = ' UPDATE ITCC_USER SET ' ;
            query += 'UserToken = @AuthID, ';
            query += 'LastLoginDate = GETDATE()';
            query += ' FROM [ITCC_User] US (NOLOCK) JOIN [ITCC_WebsiteUser] WU (NOLOCK) ';
            query += ' ON (US.ITCC_UserID = WU.ITCC_UserID) ';
            query += ' JOIN [ITCC_Website] WS (NOLOCK) ON (WU.ITCC_WebsiteID = WS.ITCC_WebsiteID) ';
            query +=   ' WHERE ( ' +
            ' (RTRIM(LTRIM(LOWER(US.UserName))) = @Username) AND (RTRIM(LTRIM(US.Password)) = @Password) ' +
            ' AND (WS.PrivateKeyID = @PrivateKeyID) ' +
            ') ';

            const request = new sql.Request();
            request.input('PrivateKeyID', sql.UniqueIdentifier, privateKeyID);
            request.input('AuthID', sql.UniqueIdentifier, authID);
            request.input('Username', sql.NVarChar(64), username);
            request.input('Password', sql.NVarChar(64), password);

            // console.log({updateUserLoginInfo: query});
            const result = await request.query(query);
            return result;

        } catch (err) {
            //console.log({updateUserLoginInfo: err});
            throw err
        }
    },

    getUserByAuthToken: async (config, privateKeyID, authId) => {
        privateKeyID = privateKeyID ? String(privateKeyID).trim().toLowerCase() : privateKeyID;

        try {
            await sql.connect(config);
            let query = ' SELECT US.*';
            query += ' FROM [ITCC_User] US (NOLOCK) JOIN [ITCC_WebsiteUser] WU (NOLOCK) ';
            query += ' ON (US.ITCC_UserID = WU.ITCC_UserID) ';
            query += ' JOIN [ITCC_Website] WS (NOLOCK) ON (WU.ITCC_WebsiteID = WS.ITCC_WebsiteID) ';
            query +=   ' WHERE ( ' +
            ' ( CONVERT(VARCHAR(38),US.UserToken) = ' + "'" + authId + "'" + ' ) ' +
            ' AND ( CONVERT(VARCHAR(38),WS.PrivateKeyID) = ' + "'" + privateKeyID + "'" + ' ) ' +
            ') ';

            // console.log(query);
            const result = await sql.query(query);
            return result;

        } catch (err) {
            //console.log({getUserByLogin: err});
            throw err
        }
    }
};

module.exports = LoginFunctions;