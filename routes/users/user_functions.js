
const sql = require("mssql");
const roleNames = "'anonymous', 'subscriber'";

const UserFunctions = {

    getUsers: async (config, privateKeyID, offset, pageSize) => {
        try {
            await sql.connect(config);
            const roleQuery = 
            "   RoleNames = STUFF( " +
            "    ( " +
            "         SELECT CONCAT(',', R.Name) " +
            "         FROM ITCC_Role R(NOLOCK) JOIN ITCC_UserRole UR (NOLOCK) ON (R.ITCC_RoleID = UR.ITCC_RoleID) " +
            "        WHERE r.ITCC_RoleID = ur.ITCC_RoleID " +
            "        FOR XML PATH('')),1,1,'' " +
            "     ) ";

            let query = ' SELECT DISTINCT ' + roleQuery + ', US.* ';
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
           
            // console.log({privateKeyID: privateKeyID, offset: offset, pageSize: pageSize});
            const result = await request.query(query);
            return result;

        } catch (err) {
            //console.log({getUsers: err});
            throw err
        }
    },

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
            request.input('id', sql.Int, id);
            const result = await request.query(query);
            return result;

        } catch (err) {
            throw err
        }
    },

    updateUser: async (config, privateKeyID, firstName, lastName) => {
        privateKeyID = privateKeyID ? String(privateKeyID).trim().toLowerCase() : privateKeyID;

        try {
            await sql.connect(config);
            let query = ' UPDATE ITCC_USER SET ';
            query += ' FirstName = @FirstName, LastName = @LastName ';
            query += ' WHERE ( ' +
                ' ( ITCC_USERID = @ID ) ' +
                '); SELECT @@ROWCOUNT; ';

            const request = new sql.Request();
            request.input('id', sql.Int, id);
            request.input('FirstName', sql.NVarChar(64), firstName);
            request.input('LastName', sql.NVarChar(128), lastName);
            const result = await request.query(query);
            return result;

        } catch (err) {
            throw err
        }
    },

    deleteUser: async (config, privateKeyID, id) => {

        try {
            await sql.connect(config);
            let query = ' DELETE US.*';
            query += ' FROM [ITCC_User] US (NOLOCK) JOIN [ITCC_WebsiteUser] WU (NOLOCK) ';
            query += ' ON (US.ITCC_UserID = WU.ITCC_UserID) ';
            query += ' JOIN [ITCC_Website] WS (NOLOCK) ON (WU.ITCC_WebsiteID = WS.ITCC_WebsiteID) ';
            query += ' JOIN [ITCC_USERROLE] UR (NOLOCK) ON (WS.ITCC_WebsiteID = UR.ITCC_WebsiteID) ';
            query += ' JOIN [ITCC_ROLE] IR (NOLOCK) ON (UR.ITCC_ROLEID = IR.ITCC_ROLEID) ';
            query += ' WHERE ( ' +
                ' (US.ITCC_USERID = @ID) AND (WS.PrivateKeyID = @PrivateKeyID) AND (US.ITCC_USERID > 1) ' +
                ') ';

            const request = new sql.Request();
            request.input('PrivateKeyID', sql.UniqueIdentifier, privateKeyID);
            request.input('id', sql.Int, id);
            const result = await request.query(query);
            return result;

        } catch (err) {
            throw err
        }
    },

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