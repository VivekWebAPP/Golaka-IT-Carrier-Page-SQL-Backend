import createAdminTable from "./Admin.js";
import createUsersTable from "./UserRegestration.js";
import pool from '../db.js';

const createTables = async () => {
    await createUsersTable();
    await createAdminTable();
    console.log('All tables created successfully');
};

export default createTables;