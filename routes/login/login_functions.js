
const sql = require("mssql");

const LoginFunctions = {

    getAuthentication: async (config, userToken, userId, websiteId) => {
        try {
            await sql.connect(config);
            let query = 'SELECT TOP 1 UserToken FROM [ITCC_User] ';
            query += ' WHERE (ITCC_UserID = ' + Number(userId) + ') ';
            query += ' AND (UserToken = CAST(' + "'" + userToken + "'" + ' AS UNIQUEIDENTIFIER) ) ';
            const result = await sql.query(query);
            return result;
        } catch (err) {
            throw err
        }
    },

    getUserByLogin: async (config, username, password, privateKeyID) => {
        privateKeyID = privateKeyID ? String(privateKeyID).trim().toLowerCase() : privateKeyID;
        username = username ? String(username).trim().toLowerCase() : username;
        password = password ? String(password).trim() : password;

        try {
            await sql.connect(config);
            let query = ' SELECT UserID, US.UserToken, ISNULL(US.LastLoginDate, GETDATE()) AS LastLoginDate, ';
            query += ' DATEDIFF(mi, ISNULL(US.LastLoginDate, GETDATE()), GETDATE()) AS TimeDiffMin, NewID() AS AuthID ';
            query += ' ,WU.ITCC_WebsiteID ,US.ITCC_UserID, WS.Title AS WebsiteName' +
            ' ,RoleName = ( ' +
            '    SELECT R.Name + ' + "'" + ','  + "'" + ' FROM ITCC_Role R(NOLOCK) JOIN ITCC_UserRole UR (NOLOCK) ON (R.ITCC_RoleID = UR.ITCC_RoleID) ' +
            '                JOIN ITCC_Website W1 (NOLOCK) ON (UR.ITCC_WebsiteID = W1.ITCC_WebsiteID) ' +
            '    WHERE ( (UR.ITCC_UserID = WU.ITCC_UserID) AND (W1.PrivateKeyID = ' + "'" + privateKeyID + "'" + ' ) ) ' +
            '    FOR XML PATH(' + "''" + ') ) ';
            query += ' FROM [ITCC_User] US (NOLOCK) JOIN [ITCC_WebsiteUser] WU (NOLOCK) ';
            query += ' ON (US.ITCC_UserID = WU.ITCC_UserID) ';
            query += ' JOIN [ITCC_Website] WS (NOLOCK) ON (WU.ITCC_WebsiteID = WS.ITCC_WebsiteID) ';
            query +=   ' WHERE ( ' +
            ' (RTRIM(LTRIM(LOWER(US.UserName))) = ' + "'" + username + "'" + ' ) AND (RTRIM(LTRIM(US.Password)) = ' + "'" + password + "'" + ') ' +
            ' AND (WS.PrivateKeyID = ' + "'" + privateKeyID + "'" + ' ) ' +
            ') ';

            const query1 = 'SELECT TOP 1 U.ITCC_UserID, U.UserName, U.UserID, U.UserToken, U.EmailAddress ' +
            ' ,WU.ITCC_WebsiteID ITCC_WebsiteID ' +
            ' ,RoleName = ( ' +
            '    SELECT TOP 1 R.Name FROM ITCC_Role R(NOLOCK) JOIN ITCC_UserRole UR (NOLOCK) ON (R.ITCC_RoleID = UR.ITCC_RoleID) ' +
            '                JOIN ITCC_Website W1 (NOLOCK) ON (UR.ITCC_WebsiteID = W1.ITCC_WebsiteID) ' +
            '    WHERE ( (UR.ITCC_UserID = WU.ITCC_UserID) AND (W1.PrivateKeyID = ' + "'" + privateKeyID + "'" + ' ) ) ' +
            '  ) ' +
            ' FROM ITCC_USER U (NOLOCK) ' +
            ' JOIN ITCC_WebsiteUser WU (NOLOCK) ON (U.ITCC_UserID = WU.ITCC_UserID) ' +
            ' JOIN ITCC_Website W (NOLOCK) ON (WU.ITCC_WebsiteID = W.ITCC_WebsiteID) ' +
            ' WHERE ( ' +
            ' (RTRIM(LTRIM(LOWER(U.UserName))) = ' + "'" + username + "'" + ' ) AND (RTRIM(LTRIM(U.Password)) = ' + "'" + password + "'" + ') ' +
            ' AND (W.PrivateKeyID = ' + "'" + privateKeyID + "'" + ' ) ' +
            ') ';

            const result = await sql.query(query);
            return result;
        } catch (err) {
            console.log({err: err});
            throw err
        }
    }
};

module.exports = LoginFunctions;