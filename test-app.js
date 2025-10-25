#!/usr/bin/env node

const BASE_URL = 'http://localhost:3000';

async function testAPI(endpoint, data) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    console.log(`✅ ${endpoint}:`, response.status, result);
    return result;
  } catch (error) {
    console.log(`❌ ${endpoint}:`, error.message);
  }
}

async function testAnalytics() {
  try {
    const response = await fetch(`${BASE_URL}/api/analytics`);
    const result = await response.json();
    console.log('📊 Analytics:', result);
  } catch (error) {
    console.log('❌ Analytics:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Testing Brand Validator API...\n');

  // Test domain check
  await testAPI('/api/domain-check', { domain: 'testbrand123.ai' });
  
  // Test brand kit generation
  await testAPI('/api/brand-kit', { 
    idea: 'AI writing assistant', 
    tone: 'modern', 
    audience: 'writers' 
  });
  
  // Test social handles
  await testAPI('/api/social-check', { handleBase: 'testbrand' });
  
  // Test IP guidance
  await testAPI('/api/ip-guidance', { 
    brandName: 'TestBrand', 
    categories: ['technology'] 
  });
  
  // Test affiliate click
  await testAPI('/api/affiliate/click', { 
    partner: 'porkbun', 
    offer: 'domain', 
    url: 'testbrand123.ai' 
  });
  
  // Test analytics
  await testAnalytics();
  
  console.log('\n✨ Testing complete!');
}

runTests();




