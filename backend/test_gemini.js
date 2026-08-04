import axios from 'axios';
import { config } from 'dotenv';
config();

async function testGemini() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
  const body = {
    contents: [{ parts: [{ text: "Hello, reply with just 'Hi'" }] }]
  };
  try {
    const res = await axios.post(url, body, { headers: { 'Content-Type': 'application/json' } });
    console.log("Success:", JSON.stringify(res.data));
  } catch (err) {
    console.log("Error:", err.response ? err.response.data : err.message);
  }
}

testGemini();
