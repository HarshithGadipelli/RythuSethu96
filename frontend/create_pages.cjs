const fs = require('fs');
const path = require('path');

const routes = [
  { path: '', component: 'LandingPage', importPath: '../../src/views/Landing/LandingPage' },
  { path: 'login', component: 'Login', importPath: '../../src/views/Auth/Login' },
  { path: 'register', component: 'Register', importPath: '../../src/views/Auth/Register' },
  { path: 'marketplace', component: 'Marketplace', importPath: '../../src/views/Marketplace/Marketplace' },
  { path: 'farm-tours', component: 'CustomerFarmTours', importPath: '../../src/views/Marketplace/CustomerFarmTours' },
  { path: 'offline-tours', component: 'CustomerOfflineTours', importPath: '../../src/views/Marketplace/CustomerOfflineTours' },
  { path: 'curated-boxes', component: 'CuratedBoxes', importPath: '../../src/views/Marketplace/CuratedBoxes' },
  { path: 'my-orders', component: 'MyOrdersPage', importPath: '../../src/views/Customer/MyOrdersPage' },
  { path: 'farmer', component: 'FarmerDashboard', importPath: '../../src/views/Farmer/FarmerDashboard' },
  { path: 'farmer/add-crop', component: 'FarmerDashboard', importPath: '../../../src/views/Farmer/FarmerDashboard', extraProps: 'initialTab="add"' },
  { path: 'agent', component: 'AgentDashboard', importPath: '../../src/views/Agent/AgentDashboard' },
  { path: 'agent/cold-storage', component: 'ColdStoragePortal', importPath: '../../../src/views/Agent/ColdStoragePortal' },
  { path: 'agent/biogas', component: 'BiogasAgentPortal', importPath: '../../../src/views/Agent/BiogasAgentPortal' },
  { path: 'agent/soil-test', component: 'SoilTestAgentPortal', importPath: '../../../src/views/Agent/SoilTestAgentPortal' },
  { path: 'admin', component: 'AdminDashboard', importPath: '../../src/views/Admin/AdminDashboard' },
  { path: 'support', component: 'Support', importPath: '../../src/views/Support/Support' },
];

const appDir = path.join(__dirname, 'app');

routes.forEach(route => {
  const routeDir = path.join(appDir, route.path);
  if (!fs.existsSync(routeDir)) {
    fs.mkdirSync(routeDir, { recursive: true });
  }

  const pagePath = path.join(routeDir, 'page.jsx');
  
  // Fix imports relative to app dir
  let relativeImport = route.importPath;
  if (route.path === '') {
    relativeImport = '../src/views/Landing/LandingPage';
  }

  const content = `"use client";\n\nimport dynamic from "next/dynamic";\n\nconst DynamicComponent = dynamic(() => import("${relativeImport}"), { ssr: false });\n\nexport default function Page() {\n  return <DynamicComponent ${route.extraProps || ''} />;\n}\n`;
  
  fs.writeFileSync(pagePath, content);
  console.log(`Created ${pagePath}`);
});
