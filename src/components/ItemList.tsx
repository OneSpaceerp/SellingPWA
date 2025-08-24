import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';

/**
 * A component that displays a list of items from the local database.
 * It uses a live query to automatically update when the data changes.
 */
export const ItemList: React.FC = () => {
  const items = useLiveQuery(() => db.items.toArray(), []);

  return (
    <div style={{ padding: '10px', border: '1px solid #444', borderRadius: '8px', margin: '10px' }}>
      <h3 style={{ marginTop: 0 }}>Synced Items</h3>
      {items === undefined && <p>Loading items...</p>}
      {items && items.length === 0 && <p>No items found in the local database. Try syncing data.</p>}
      {items && items.length > 0 &&
        <ul style={{ listStyle: 'none', padding: 0, maxHeight: '40vh', overflowY: 'auto' }}>
          {items.map(item => (
            <li key={item.name} style={{ padding: '8px', borderBottom: '1px solid #333' }}>
              <strong>{item.item_name || 'No Name'}</strong> ({item.name})
              <br />
              <small>Group: {item.item_group} | UOM: {item.stock_uom}</small>
            </li>
          ))}
        </ul>
      }
    </div>
  );
};
