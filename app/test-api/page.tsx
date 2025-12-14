export default async function TestAPIPage() {
  const apiKey = process.env.BASE44_API_KEY;
  const appId = process.env.BASE44_APP_ID;
  
  if (!apiKey || !appId) {
    return (
      <div style={{ padding: '40px', fontFamily: 'Arial, sans-serif', color: '#000' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', color: '#000' }}>
          Environment Variables Not Loaded
        </h1>
        <p style={{ color: '#000' }}>API Key: {apiKey ? 'Set' : 'Missing'}</p>
        <p style={{ color: '#000' }}>App ID: {appId ? 'Set' : 'Missing'}</p>
      </div>
    );
  }

  let data = null;
  let error = null;

  try {
    const url = `https://app.base44.com/api/apps/${appId}/entities/ReferralPartner`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'api_key': apiKey,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API returned ${response.status}: ${errorText}`);
    }

    data = await response.json();
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  return (
    <div style={{ padding: '40px', fontFamily: 'Arial, sans-serif', maxWidth: '800px', color: '#000' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '24px', color: '#000' }}>
        🔌 Base44 API Connection Test
      </h1>
      
      <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px', color: '#000' }}>
          ✅ Environment Check
        </h2>
        <p style={{ marginBottom: '4px', color: '#000' }}>
          <strong>API Key:</strong> {apiKey.substring(0, 10)}...
        </p>
        <p style={{ color: '#000' }}>
          <strong>App ID:</strong> {appId}
        </p>
      </div>

      {error && (
        <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#ffebee', borderRadius: '8px', border: '2px solid #f44336' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px', color: '#c62828' }}>
            ❌ Error
          </h2>
          <p style={{ color: '#c62828', fontFamily: 'monospace' }}>{error}</p>
        </div>
      )}

      {data && !error && (
        <div style={{ padding: '16px', backgroundColor: '#e8f5e9', borderRadius: '8px', border: '2px solid #4caf50' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px', color: '#2e7d32' }}>
            ✅ Success! Connected to Base44
          </h2>
          <p style={{ marginBottom: '16px', fontSize: '18px', color: '#1b5e20' }}>
            <strong>ReferralPartner Records Found:</strong> {Array.isArray(data) ? data.length : 'Unknown'}
          </p>
          
          {Array.isArray(data) && data.length === 0 && (
            <div style={{ padding: '12px', backgroundColor: '#fff3cd', borderRadius: '4px', border: '1px solid #ffc107' }}>
              <p style={{ color: '#856404', margin: 0 }}>
                ℹ️ No records yet! This is normal - your ReferralPartner table is empty. 
                Records will appear here when partners sign up through your Tally form.
              </p>
            </div>
          )}
          
          {Array.isArray(data) && data.length > 0 && (
            <details style={{ marginTop: '16px' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#2e7d32' }}>
                📋 Show first record
              </summary>
              <pre style={{ 
                marginTop: '8px', 
                padding: '12px', 
                backgroundColor: 'white', 
                borderRadius: '4px', 
                overflow: 'auto',
                fontSize: '14px',
                color: '#000',
                border: '1px solid #ddd'
              }}>
                {JSON.stringify(data[0], null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}