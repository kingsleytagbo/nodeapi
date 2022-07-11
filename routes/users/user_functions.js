
const sql = require("mssql");
const roleNames = "'anonymous', 'subscriber'";

const UserFunctions = {

    getUsers: async (config, privateKeyID, offset, pageSize) => {
        /*
            SELECT a paged list of users & associated roles from SQL Server
        */
        try {
            await sql.connect(config);
            const roleQuery =
            ' RoleNames = STUFF( ( ' +
            '    SELECT  ' + "'" + ','  + "'" + ' + R.Name ' + ' FROM ITCC_Role R(NOLOCK) JOIN ITCC_UserRole UR (NOLOCK) ON (R.ITCC_RoleID = UR.ITCC_RoleID) ' +
            '                JOIN ITCC_Website W1 (NOLOCK) ON (UR.ITCC_WebsiteID = W1.ITCC_WebsiteID) ' +
            '    WHERE ( (UR.ITCC_UserID = WU.ITCC_UserID) AND (W1.PrivateKeyID = @PrivateKeyID) ) ' +
            '    FOR XML PATH(' + "''" + ') ) ' + ' ,1,1, ' + " '') ";

            let query = ' SELECT ' + roleQuery + ', US.* ';
            query += ' FROM [ITCC_User] US (NOLOCK) JOIN [ITCC_WebsiteUser] WU (NOLOCK) ';
            query += ' ON (US.ITCC_UserID = WU.ITCC_UserID) ';
            query += ' JOIN [ITCC_Website] WS (NOLOCK) ON (WU.ITCC_WebsiteID = WS.ITCC_WebsiteID) ';
            query += ' JOIN [ITCC_USERROLE] UR (NOLOCK) ON (WS.ITCC_WebsiteID = UR.ITCC_WebsiteID) ';
            query += ' JOIN [ITCC_ROLE] RL (NOLOCK) ON (UR.ITCC_ROLEID = RL.ITCC_ROLEID) ';
            query += ' WHERE ( (WS.PrivateKeyID = @PrivateKeyID) ) ';
            query += ' ORDER BY US.UserName Desc ';
            query += ' OFFSET @Offset ROWS ';
            query += ' FETCH NEXT @PageSize ROWS ONLY ';

            const request = new sql.Request();
            request.input('PrivateKeyID', sql.UniqueIdentifier, privateKeyID);
            request.input('Offset', sql.Int, offset);
            request.input('PageSize', sql.Int, pageSize);

            //console.log({getUsers: query, privateKeyID: privateKeyID, offset: offset, pageSize: pageSize});
            const result = await request.query(query);
            return result;

        } catch (err) {
            //console.log({getUsers: err});
            throw err
        }
    },

    /*
        SELECTS a singLe user & associated roles from SQL Server
    */
    getUser: async (config, privateKeyID, id) => {

        try {
            await sql.connect(config);
            let query = ' SELECT US.*';
            query += ' FROM [ITCC_User] US (NOLOCK) JOIN [ITCC_WebsiteUser] WU (NOLOCK) ';
            query += ' ON (US.ITCC_UserID = WU.ITCC_UserID) ';
            query += ' JOIN [ITCC_Website] WS (NOLOCK) ON (WU.ITCC_WebsiteID = WS.ITCC_WebsiteID) ';
            query += ' WHERE ( ' +
                ' (US.ITCC_USERID = @ID) AND (WS.PrivateKeyID = @PrivateKeyID) ' +
                ') ';

            const request = new sql.Request();
            request.input('PrivateKeyID', sql.UniqueIdentifier, privateKeyID);
            request.input('ID', sql.Int, id);
            const result = await request.query(query);
            return result;

        } catch (err) {
            throw err
        }
    },

    /*
        Updates a singLe user's information on SQL Server
    */
    updateUser: async (config, privateKeyID, id, username, emailaddress) => {
        privateKeyID = privateKeyID ? String(privateKeyID).trim().toLowerCase() : privateKeyID;

        try {
            await sql.connect(config);
            let query = ' UPDATE ITCC_USER SET ';
            query += ' Username = @Username, EmailAddress = @EmailAddress ';
            query += ' WHERE ( ' +
                ' ( ITCC_USERID = @ID ) ' +
                '); SELECT @@ROWCOUNT; ';

            const request = new sql.Request();
            request.input('ID', sql.Int, id);
            request.input('Username', sql.NVarChar(64), username);
            request.input('EmailAddress', sql.NVarChar(64), emailaddress);
            const result = await request.query(query);
            return result;

        } catch (err) {
            throw err
        }
    },

    /*
        Deletes a singLe non-admin user's information on SQL Server  
    */
    deleteUser: async (config, privateKeyID, id) => {

        try {
            await sql.connect(config);

            let query = ' BEGIN TRAN; ';

            // DELETE USERROLE
            query += ' DELETE UR ';
            query += ' FROM [ITCC_User] US (NOLOCK) JOIN [ITCC_WebsiteUser] WU (NOLOCK) ';
            query += ' ON (US.ITCC_UserID = WU.ITCC_UserID) ';
            query += ' JOIN [ITCC_Website] WS (NOLOCK) ON (WU.ITCC_WebsiteID = WS.ITCC_WebsiteID) ';
            query += ' JOIN [ITCC_USERROLE] UR (NOLOCK) ON (WS.ITCC_WebsiteID = UR.ITCC_WebsiteID) ';
            query += ' JOIN [ITCC_ROLE] IR (NOLOCK) ON (UR.ITCC_ROLEID = IR.ITCC_ROLEID) ';
            query += ' WHERE ( ' +
                ' (UR.ITCC_USERID = @ID) AND (WS.PrivateKeyID = @PrivateKeyID) AND (UR.ITCC_USERID > 1) ' +
                '); ';


            // DELETE WEBSITEUSER
            query += ' DELETE WU ';
            query += ' FROM [ITCC_User] US (NOLOCK) JOIN [ITCC_WebsiteUser] WU (NOLOCK) ';
            query += ' ON (US.ITCC_UserID = WU.ITCC_UserID) ';
            query += ' JOIN [ITCC_Website] WS (NOLOCK) ON (WU.ITCC_WebsiteID = WS.ITCC_WebsiteID) ';
            query += ' JOIN [ITCC_USERROLE] UR (NOLOCK) ON (WS.ITCC_WebsiteID = UR.ITCC_WebsiteID) ';
            query += ' JOIN [ITCC_ROLE] IR (NOLOCK) ON (UR.ITCC_ROLEID = IR.ITCC_ROLEID) ';
            query += ' WHERE ( ' +
                ' (WU.ITCC_USERID = @ID) AND (WS.PrivateKeyID = @PrivateKeyID) AND (WU.ITCC_USERID > 1) ' +
                '); ';

            // DELETE USER
            query += ' DELETE US ';
            query += ' FROM [ITCC_User] US (NOLOCK) ';
            query += ' WHERE ( ' +
                ' (US.ITCC_USERID = @ID) AND (US.ITCC_USERID > 1) ' +
                '); ';

            query += ' COMMIT';

            const request = new sql.Request();
            request.input('PrivateKeyID', sql.UniqueIdentifier, privateKeyID);
            request.input('ID', sql.Int, id);
            const result = await request.query(query);
            return result;

        } catch (err) {
            throw err
        }
    },

    /*
        Creates a singLe user's information on SQL Server
    */
    createUser: async (config, privateKeyID,
        username, firstname, lastname, email, isonline, isapproved, islockedout,
        password, statusid, createuserid, modifyuserid) => {
        privateKeyID = privateKeyID ? String(privateKeyID).trim().toLowerCase() : privateKeyID;

        try {
            await sql.connect(config);
            let query = ' SELECT @SiteID = ITCC_WebsiteID FROM ITCC_WEBSITE (NOLOCK) WHERE (PrivateKeyID = @PrivateKeyID) ';
            query += ' BEGIN TRAN; ';
            query += ' INSERT INTO ITCC_USER (';
            query += ' UserName, Password, FirstName, LastName, EmailAddress, ';
            query += ' IsOnline, IsApproved, IsLockedOut, ITCC_StatusID, ';
            query += ' UserID, UserToken, CreateDate, CreateUserID, ModifyDate, ModifyUserID';
            query += ' ) ';
            query += ' VALUES ( ' +
                ' @UserName, @Password, @FirstName, @LastName, @EmailAddress, ' +
                ' @IsOnline, @IsApproved, @IsLockedOut, @StatusID, ' +
                ' NewID(), NewID(), getdate(), 1, getdate(), 1' +
                '); SELECT @NEWID = SCOPE_IDENTITY();';

            query += ' INSERT INTO ITCC_WEBSITEUSER (ITCC_WebsiteID, ITCC_UserID, CreateDate, CreateUserID, ModifyDate, ModifyUserID )';
            query += ' SELECT  @SiteID, @NEWID, getdate(), 1, getdate(), 1';

            query += ' INSERT INTO ITCC_USERROLE (ITCC_WebsiteID, ITCC_UserID, ITCC_ROLEID )';
            query += ' SELECT DISTINCT @SiteID, @NEWID, RL.ITCC_ROLEID ';
            query += ' FROM ITCC_WEBSITE WS JOIN ITCC_ROLE RL ';
            query += ' ON (WS.ITCC_WebsiteID = RL.ITCC_WebsiteID) ';
            query += ' WHERE ( (WS.PrivateKeyID = @PrivateKeyID) AND RL.NAME IN (' + roleNames + ' ) ); '

            query += ' SELECT @NEWID NEWID,  @SiteID SiteID; COMMIT;'

            const request = new sql.Request();
            request.output('NewID', sql.Int);
            request.output('SiteID', sql.Int);
            request.input('PrivateKeyID', sql.UniqueIdentifier, privateKeyID);
            request.input('UserName', sql.NVarChar(64), username);
            request.input('EmailAddress', sql.NVarChar(64), email);
            request.input('Password', sql.NVarChar(64), password);
            request.input('FirstName', sql.NVarChar(64), firstname);
            request.input('LastName', sql.NVarChar(128), lastname);
            request.input('StatusID', sql.Bit, 1);
            request.input('IsApproved', sql.Bit, 1);
            request.input('IsOnline', sql.Bit, 1);
            request.input('IsLockedOut', sql.Bit, 1);
            const result = await request.query(query);
            return result;

        } catch (err) {
            throw err
        }
    },
};

module.exports = UserFunctions;