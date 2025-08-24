import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';

/**
 * A component that displays a list of customers from the local database.
 * It uses a live query to automatically update when the data changes.
 */
export const CustomerList: React.FC = () => {
  const customers = useLiveQuery(() => db.customers.toArray(), []);

  return (
    <div style={{ padding: '10px', border: '1px solid #444', borderRadius: '8px', margin: '10px' }}>
      <h3 style={{ marginTop: 0 }}>Synced Customers</h3>
      {customers === undefined && <p>Loading customers...</p>}
      {customers && customers.length === 0 && <p>No customers found in the local database. Try syncing data.</p>}
      {customers && customers.length > 0 &&
        <ul style={{ listStyle: 'none', padding: 0, maxHeight: '40vh', overflowY: 'auto' }}>
          {customers.map(customer => (
            <li key={customer.name} style={{ padding: '8px', borderBottom: '1px solid #333' }}>
              <strong>{customer.customer_name || 'No Name'}</strong> ({customer.name})
              <br />
              <small>Group: {customer.customer_group}</small>
            </li>
          ))}
        </ul>
      }
    </div>
  );
};
