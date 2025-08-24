import React, { useEffect, useState } from 'react';
import { apiService, PosProfile } from '../services/apiService';

export const PosProfileSelectionPage: React.FC = () => {
  const [profiles, setProfiles] = useState<PosProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfiles = async () => {
      setLoading(true);
      try {
        const data = await apiService.getPosProfiles();
        setProfiles(data);
      } catch (err) {
        setError('Failed to fetch POS Profiles. Please ensure you have the correct permissions and try logging out and in again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, []);

  const handleSelectProfile = (profileName: string) => {
    localStorage.setItem('erpnext-pos-profile', profileName);
    alert(`POS Profile "${profileName}" has been selected.`);
    // Reload the application to proceed to the main app view.
    window.location.reload();
  };

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading POS Profiles...</div>;
  }

  if (error) {
    return <div style={{ padding: '20px', color: 'red' }}>{error}</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: 'auto' }}>
      <h1>Select a POS Profile</h1>
      <p>Choose the POS Profile you want to use for this session.</p>
      {profiles.length === 0 ? (
        <p>No POS Profiles could be found for your user account.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {profiles.map(profile => (
            <li
              key={profile.name}
              onClick={() => handleSelectProfile(profile.name)}
              style={{
                cursor: 'pointer',
                padding: '15px',
                border: '1px solid #ccc',
                marginBottom: '10px',
                borderRadius: '5px',
                transition: 'background-color 0.2s',
              }}
              onMouseOver={e => e.currentTarget.style.backgroundColor = '#f0f0f0'}
              onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <strong style={{ fontSize: '1.2em' }}>{profile.name}</strong>
              <div style={{ color: '#555' }}>Company: {profile.company} | Currency: {profile.currency}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
