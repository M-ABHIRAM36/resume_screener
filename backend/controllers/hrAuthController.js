const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const usersFile = path.join(__dirname, '..', 'data', 'hr_users.json');

function readUsers(){
  try{ return JSON.parse(fs.readFileSync(usersFile)); }catch(e){ return []; }
}
function writeUsers(u){ fs.writeFileSync(usersFile, JSON.stringify(u, null, 2)); }

exports.signup = (req, res) => {
  const { companyName, email, password } = req.body;
  if(!companyName || !email || !password) return res.status(400).json({error:'Missing fields'});
  const users = readUsers();
  if(users.find(x=>x.email===email)) return res.status(400).json({error:'Email exists'});
  const newUser = { id: 'hr_'+Date.now(), companyName, email, password };
  users.push(newUser);
  writeUsers(users);
  const token = jwt.sign({ id: newUser.id, email: newUser.email, companyName: newUser.companyName }, process.env.JWT_SECRET || 'demo-secret');
  res.json({ token, user: { id: newUser.id, companyName: newUser.companyName, email: newUser.email } });
}

exports.login = (req, res) => {
  const { email, password } = req.body;
  if(!email || !password) return res.status(400).json({error:'Missing fields'});
  const users = readUsers();
  const found = users.find(x=>x.email===email && x.password===password);
  if(!found) return res.status(401).json({error:'Invalid credentials'});
  const token = jwt.sign({ id: found.id, email: found.email, companyName: found.companyName }, process.env.JWT_SECRET || 'demo-secret');
  res.json({ token, user: { id: found.id, companyName: found.companyName, email: found.email } });
}
