async function test() {
  const loginRes = await fetch('http://localhost:3000/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'prkgraphicz@gmail.com', password: 'Password1!' })
  });
  const loginData = await loginRes.json();
  console.log('Login:', loginData);
  if (loginData.data && loginData.data.token) {
    const usersRes = await fetch('http://localhost:3000/api/users', {
      headers: { 'Authorization': 'Bearer ' + loginData.data.token }
    });
    console.log('Users:', await usersRes.json());
  }
}
test();
