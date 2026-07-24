
import { PoolClient } from 'pg';

/**
 * Utility to set session context for PostgreSQL Audit Triggers.
 * This should be called within a transaction before making any data changes.
 */
export class AuditUtils {
    /**
     * Sets context variables in the database session.
     * @param client The database client (PoolClient).
     * @param userId The ID of the current user.
     * @param ip The client's IP address.
     * @param module The name of the module (e.g., 'RECEPTION').
     */
    static async setContext(client: PoolClient, userId: string, ip: string = '127.0.0.1', module: string = 'VIMES HIS') {
        // Use SET LOCAL to ensure variables only persist for the duration of the transaction
        await client.query(`SET LOCAL "app.current_user_id" = '${userId}'`);
        await client.query(`SET LOCAL "app.client_ip" = '${ip}'`);
        await client.query(`SET LOCAL "app.context_module" = '${module}'`);
    }
}

export default AuditUtils;
