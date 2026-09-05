import { 
  GraphNode, 
  GraphEdge, 
  TransactionRecord, 
  RiskCase, 
  PolicyConfig, 
  EvaluationRunMetrics, 
  AuditEvent 
} from '../types';

// Exchange rate: 1 USD = 94.45 INR
export const USD_TO_INR = 94.45;

export const INITIAL_RING_017_NODES: GraphNode[] = [
  // 1. Devices
  { id: 'Device-17', label: 'Device #17 (macOS / Safari 18.2 Fingerprint: df82a)', type: 'device', riskScore: 0.96, isFlagged: true },
  { id: 'Device-22', label: 'Device #22 (Windows 11 / Automated Chromium headless)', type: 'device', riskScore: 0.93, isFlagged: true },
  { id: 'Device-09', label: 'Device #09 (Android Emulator Bluestacks v5.1)', type: 'device', riskScore: 0.88, isFlagged: true },
  { id: 'Device-31', label: 'Device #31 (Linux Ubuntu Server - Scraper Botnet)', type: 'device', riskScore: 0.95, isFlagged: true },

  // 2. IP Proxies
  { id: 'IP-07', label: 'IP 198.51.100.44 (Datacenter VPN - DigitalOcean Mumbai)', type: 'ip', riskScore: 0.91, isFlagged: true },
  { id: 'IP-08', label: 'IP 203.0.113.88 (Tor Exit Relay Node #41)', type: 'ip', riskScore: 0.98, isFlagged: true },
  { id: 'IP-14', label: 'IP 45.33.22.119 (Residential Proxy Mesh)', type: 'ip', riskScore: 0.86, isFlagged: true },
  { id: 'IP-21', label: 'IP 185.220.101.5 (Mullvad WireGuard Tunnel Bangalore)', type: 'ip', riskScore: 0.89, isFlagged: true },

  // 3. Addresses
  { id: 'Address-12', label: '742 Evergreen Terrace, Suite 4B, Bengaluru, KA', type: 'address', riskScore: 0.88, isFlagged: true },
  { id: 'Address-13', label: '404 Cache Road, Mail Drop #9, Mumbai, MH', type: 'address', riskScore: 0.84, isFlagged: true },
  { id: 'Address-14', label: '120 Virtual Commercial Hub, Gurugram, HR', type: 'address', riskScore: 0.79 },
  { id: 'Address-15', label: '55 Industrial Freight Yard, Hyderabad, TS', type: 'address', riskScore: 0.82, isFlagged: true },
  { id: 'Address-16', label: '88 Cyber Park Co-work Desk #12, Noida, UP', type: 'address', riskScore: 0.76 },

  // 4. Payment Instruments
  { id: 'Instrument-4', label: 'Visa ending 8812 (BIN 414720 - Virtual Prepaid)', type: 'payment_instrument', riskScore: 0.95, isFlagged: true },
  { id: 'Instrument-5', label: 'Mastercard ending 4409 (Revolut Disposable)', type: 'payment_instrument', riskScore: 0.92, isFlagged: true },
  { id: 'Instrument-6', label: 'RuPay ending 1004 (Synthesized Token PAN)', type: 'payment_instrument', riskScore: 0.89, isFlagged: true },
  { id: 'Instrument-7', label: 'Visa ending 3391 (HDFC Corporate Virtual Card)', type: 'payment_instrument', riskScore: 0.87 },
  { id: 'Instrument-8', label: 'Mastercard ending 9112 (PayTM Prepaid Wallet)', type: 'payment_instrument', riskScore: 0.91, isFlagged: true },
  { id: 'Instrument-9', label: 'Visa ending 7730 (SBI Prepaid Forex Card)', type: 'payment_instrument', riskScore: 0.85 },

  // 5. Customers (20 accounts)
  { id: 'C101', label: 'Cust: Alex V. (alex.v12@temp-inbox.com)', type: 'customer', riskScore: 0.94, isFlagged: true },
  { id: 'C102', label: 'Cust: Elena R. (elena.r99@temp-inbox.com)', type: 'customer', riskScore: 0.95, isFlagged: true },
  { id: 'C103', label: 'Cust: Marcus T. (marcus.t@temp-inbox.com)', type: 'customer', riskScore: 0.93, isFlagged: true },
  { id: 'C104', label: 'Cust: Sarah K. (sarah.k@proton.me)', type: 'customer', riskScore: 0.91, isFlagged: true },
  { id: 'C105', label: 'Cust: Jason B. (jason.b7@proton.me)', type: 'customer', riskScore: 0.92, isFlagged: true },
  { id: 'C106', label: 'Cust: Chloe M. (chloe.m@duck.com)', type: 'customer', riskScore: 0.90, isFlagged: true },
  { id: 'C107', label: 'Cust: David L. (david.l0@duck.com)', type: 'customer', riskScore: 0.96, isFlagged: true },
  { id: 'C108', label: 'Cust: Nora P. (nora.p@temp-inbox.com)', type: 'customer', riskScore: 0.89, isFlagged: true },
  { id: 'C109', label: 'Cust: Kevin W. (kevin.w1@temp-inbox.com)', type: 'customer', riskScore: 0.93, isFlagged: true },
  { id: 'C110', label: 'Cust: Mia Z. (mia.z44@temp-inbox.com)', type: 'customer', riskScore: 0.94, isFlagged: true },
  { id: 'C111', label: 'Cust: Brian O. (brian.o@temp-inbox.com)', type: 'customer', riskScore: 0.90, isFlagged: true },
  { id: 'C112', label: 'Cust: Lisa H. (lisa.h3@proton.me)', type: 'customer', riskScore: 0.88, isFlagged: true },
  { id: 'C113', label: 'Cust: Liam C. (liam.c9@temp-inbox.com)', type: 'customer', riskScore: 0.92, isFlagged: true },
  { id: 'C114', label: 'Cust: Sophia G. (sophia.g@duck.com)', type: 'customer', riskScore: 0.93, isFlagged: true },
  { id: 'C115', label: 'Cust: Rohan M. (rohan.m9@tempmail.in)', type: 'customer', riskScore: 0.89, isFlagged: true },
  { id: 'C116', label: 'Cust: Ananya S. (ananya.s4@burner.cc)', type: 'customer', riskScore: 0.91, isFlagged: true },
  { id: 'C117', label: 'Cust: Vikram P. (vikram.p1@temp-inbox.com)', type: 'customer', riskScore: 0.87, isFlagged: true },
  { id: 'C118', label: 'Cust: Meera D. (meera.d8@duck.com)', type: 'customer', riskScore: 0.85, isFlagged: true },
  { id: 'C119', label: 'Cust: Arjun K. (arjun.k3@proton.me)', type: 'customer', riskScore: 0.88, isFlagged: true },
  { id: 'C120', label: 'Cust: Priya N. (priya.n7@tempmail.in)', type: 'customer', riskScore: 0.90, isFlagged: true },

  // 6. Target Merchants
  { id: 'M-Apex', label: 'Merchant: Apex Electronics Express', type: 'merchant', riskScore: 0.45 },
  { id: 'M-Cloud', label: 'Merchant: ByteWave Cloud Credits', type: 'merchant', riskScore: 0.62, isFlagged: true },
  { id: 'M-Gift', label: 'Merchant: QuickPerks GiftCards India', type: 'merchant', riskScore: 0.84, isFlagged: true },
  { id: 'M-PayZ', label: 'Merchant: PayZ Gaming Topups', type: 'merchant', riskScore: 0.78, isFlagged: true },
  { id: 'M-Nova', label: 'Merchant: Nova Crypto Remit Gateway', type: 'merchant', riskScore: 0.89, isFlagged: true },

  // 7. Flagged Transactions in Graph
  { id: 'TX-98421', label: 'Tx #98421 (₹47,178 - QuickPerks)', type: 'transaction', riskScore: 0.96, isFlagged: true },
  { id: 'TX-98419', label: 'Tx #98419 (₹46,753 - ByteWave Cloud)', type: 'transaction', riskScore: 0.94, isFlagged: true },
  { id: 'TX-98402', label: 'Tx #98402 (₹47,225 - QuickPerks)', type: 'transaction', riskScore: 0.93, isFlagged: true },
  { id: 'TX-98390', label: 'Tx #98390 (₹46,281 - Nova Crypto)', type: 'transaction', riskScore: 0.95, isFlagged: true },
  { id: 'TX-98375', label: 'Tx #98375 (₹45,808 - PayZ Gaming)', type: 'transaction', riskScore: 0.91, isFlagged: true }
];

export const INITIAL_RING_017_EDGES: GraphEdge[] = [
  // Device-17 shared by accounts
  { id: 'e1', source: 'C101', target: 'Device-17', relationship: 'used_device', weight: 1.0, firstSeen: '10:12:04', lastSeen: '10:58:19' },
  { id: 'e2', source: 'C102', target: 'Device-17', relationship: 'used_device', weight: 1.0, firstSeen: '10:14:22', lastSeen: '10:55:01' },
  { id: 'e3', source: 'C103', target: 'Device-17', relationship: 'used_device', weight: 1.0, firstSeen: '10:15:30', lastSeen: '10:59:12' },
  { id: 'e4', source: 'C104', target: 'Device-17', relationship: 'used_device', weight: 1.0, firstSeen: '10:16:00', lastSeen: '10:48:45' },
  { id: 'e5', source: 'C105', target: 'Device-17', relationship: 'used_device', weight: 1.0, firstSeen: '10:17:15', lastSeen: '10:52:10' },
  { id: 'e6', source: 'C106', target: 'Device-17', relationship: 'used_device', weight: 1.0, firstSeen: '10:18:40', lastSeen: '10:45:00' },
  { id: 'e7', source: 'C107', target: 'Device-17', relationship: 'used_device', weight: 1.0, firstSeen: '10:19:10', lastSeen: '10:59:44' },
  { id: 'e8', source: 'C108', target: 'Device-17', relationship: 'used_device', weight: 1.0, firstSeen: '10:20:05', lastSeen: '10:40:22' },
  { id: 'e9', source: 'C109', target: 'Device-17', relationship: 'used_device', weight: 1.0, firstSeen: '10:21:50', lastSeen: '10:51:30' },
  { id: 'e10', source: 'C110', target: 'Device-17', relationship: 'used_device', weight: 1.0, firstSeen: '10:22:12', lastSeen: '10:49:18' },
  { id: 'e11', source: 'C111', target: 'Device-17', relationship: 'used_device', weight: 1.0, firstSeen: '10:23:44', lastSeen: '10:44:05' },
  { id: 'e12', source: 'C112', target: 'Device-17', relationship: 'used_device', weight: 1.0, firstSeen: '10:24:19', lastSeen: '10:39:10' },
  { id: 'e13', source: 'C113', target: 'Device-17', relationship: 'used_device', weight: 1.0, firstSeen: '10:25:01', lastSeen: '10:56:40' },
  { id: 'e14', source: 'C114', target: 'Device-17', relationship: 'used_device', weight: 1.0, firstSeen: '10:26:30', lastSeen: '10:58:00' },

  // Device-22 shared by second batch
  { id: 'e14b', source: 'C115', target: 'Device-22', relationship: 'used_device', weight: 0.95, firstSeen: '10:28:00', lastSeen: '10:52:00' },
  { id: 'e14c', source: 'C116', target: 'Device-22', relationship: 'used_device', weight: 0.95, firstSeen: '10:29:10', lastSeen: '10:54:15' },
  { id: 'e14d', source: 'C117', target: 'Device-22', relationship: 'used_device', weight: 0.95, firstSeen: '10:30:20', lastSeen: '10:55:00' },
  { id: 'e14e', source: 'C118', target: 'Device-09', relationship: 'used_device', weight: 0.90, firstSeen: '10:31:00', lastSeen: '10:51:00' },
  { id: 'e14f', source: 'C119', target: 'Device-09', relationship: 'used_device', weight: 0.90, firstSeen: '10:32:45', lastSeen: '10:53:10' },
  { id: 'e14g', source: 'C120', target: 'Device-31', relationship: 'used_device', weight: 0.98, firstSeen: '10:34:00', lastSeen: '10:59:00' },

  // Shared IPs
  { id: 'e15', source: 'C101', target: 'IP-07', relationship: 'connected_ip', weight: 0.9, firstSeen: '10:12:00', lastSeen: '10:45:00' },
  { id: 'e16', source: 'C102', target: 'IP-07', relationship: 'connected_ip', weight: 0.9, firstSeen: '10:14:00', lastSeen: '10:44:00' },
  { id: 'e17', source: 'C107', target: 'IP-07', relationship: 'connected_ip', weight: 0.9, firstSeen: '10:19:00', lastSeen: '10:58:00' },
  { id: 'e18', source: 'C103', target: 'IP-08', relationship: 'connected_ip', weight: 0.95, firstSeen: '10:15:00', lastSeen: '10:59:00' },
  { id: 'e19', source: 'C104', target: 'IP-08', relationship: 'connected_ip', weight: 0.95, firstSeen: '10:16:00', lastSeen: '10:48:00' },
  { id: 'e20', source: 'C109', target: 'IP-08', relationship: 'connected_ip', weight: 0.95, firstSeen: '10:21:00', lastSeen: '10:50:00' },
  { id: 'e21', source: 'C114', target: 'IP-08', relationship: 'connected_ip', weight: 0.95, firstSeen: '10:26:00', lastSeen: '10:57:00' },
  { id: 'e21b', source: 'C115', target: 'IP-14', relationship: 'connected_ip', weight: 0.88, firstSeen: '10:28:00', lastSeen: '10:52:00' },
  { id: 'e21c', source: 'C116', target: 'IP-14', relationship: 'connected_ip', weight: 0.88, firstSeen: '10:29:00', lastSeen: '10:54:00' },
  { id: 'e21d', source: 'C120', target: 'IP-21', relationship: 'connected_ip', weight: 0.92, firstSeen: '10:34:00', lastSeen: '10:59:00' },

  // Shared Addresses
  { id: 'e22', source: 'C101', target: 'Address-12', relationship: 'billing_address', weight: 0.85, firstSeen: '10:12:00', lastSeen: '10:58:00' },
  { id: 'e23', source: 'C102', target: 'Address-12', relationship: 'billing_address', weight: 0.85, firstSeen: '10:14:00', lastSeen: '10:55:00' },
  { id: 'e24', source: 'C103', target: 'Address-12', relationship: 'billing_address', weight: 0.85, firstSeen: '10:15:00', lastSeen: '10:59:00' },
  { id: 'e25', source: 'C107', target: 'Address-12', relationship: 'billing_address', weight: 0.85, firstSeen: '10:19:00', lastSeen: '10:59:00' },
  { id: 'e26', source: 'C104', target: 'Address-13', relationship: 'billing_address', weight: 0.8, firstSeen: '10:16:00', lastSeen: '10:48:00' },
  { id: 'e27', source: 'C105', target: 'Address-13', relationship: 'billing_address', weight: 0.8, firstSeen: '10:17:00', lastSeen: '10:52:00' },
  { id: 'e28', source: 'C106', target: 'Address-14', relationship: 'billing_address', weight: 0.75, firstSeen: '10:18:00', lastSeen: '10:45:00' },
  { id: 'e28b', source: 'C115', target: 'Address-15', relationship: 'billing_address', weight: 0.82, firstSeen: '10:28:00', lastSeen: '10:52:00' },
  { id: 'e28c', source: 'C116', target: 'Address-15', relationship: 'billing_address', weight: 0.82, firstSeen: '10:29:00', lastSeen: '10:54:00' },

  // Shared Payment Instruments
  { id: 'e29', source: 'C101', target: 'Instrument-4', relationship: 'shared_card', weight: 0.98, firstSeen: '10:12:00', lastSeen: '10:58:00' },
  { id: 'e30', source: 'C102', target: 'Instrument-4', relationship: 'shared_card', weight: 0.98, firstSeen: '10:14:00', lastSeen: '10:55:00' },
  { id: 'e31', source: 'C107', target: 'Instrument-4', relationship: 'shared_card', weight: 0.98, firstSeen: '10:19:00', lastSeen: '10:59:00' },
  { id: 'e32', source: 'C103', target: 'Instrument-5', relationship: 'shared_card', weight: 0.92, firstSeen: '10:15:00', lastSeen: '10:59:00' },
  { id: 'e33', source: 'C104', target: 'Instrument-5', relationship: 'shared_card', weight: 0.92, firstSeen: '10:16:00', lastSeen: '10:48:00' },
  { id: 'e34', source: 'C105', target: 'Instrument-6', relationship: 'shared_card', weight: 0.88, firstSeen: '10:17:00', lastSeen: '10:52:00' },
  { id: 'e35', source: 'C108', target: 'Instrument-7', relationship: 'shared_card', weight: 0.85, firstSeen: '10:20:00', lastSeen: '10:40:00' },
  { id: 'e35b', source: 'C115', target: 'Instrument-8', relationship: 'shared_card', weight: 0.94, firstSeen: '10:28:00', lastSeen: '10:52:00' },
  { id: 'e35c', source: 'C116', target: 'Instrument-8', relationship: 'shared_card', weight: 0.94, firstSeen: '10:29:00', lastSeen: '10:54:00' },
  { id: 'e35d', source: 'C120', target: 'Instrument-9', relationship: 'shared_card', weight: 0.90, firstSeen: '10:34:00', lastSeen: '10:59:00' },

  // Transaction Edges
  { id: 'e36', source: 'C107', target: 'TX-98421', relationship: 'initiated_tx', weight: 1.0, firstSeen: '10:59:44', lastSeen: '10:59:44' },
  { id: 'e37', source: 'TX-98421', target: 'M-Gift', relationship: 'targeted_merchant', weight: 1.0, firstSeen: '10:59:44', lastSeen: '10:59:44' },
  { id: 'e38', source: 'C101', target: 'TX-98419', relationship: 'initiated_tx', weight: 1.0, firstSeen: '10:58:19', lastSeen: '10:58:19' },
  { id: 'e39', source: 'TX-98419', target: 'M-Cloud', relationship: 'targeted_merchant', weight: 1.0, firstSeen: '10:58:19', lastSeen: '10:58:19' },
  { id: 'e40', source: 'C103', target: 'TX-98402', relationship: 'initiated_tx', weight: 1.0, firstSeen: '10:55:01', lastSeen: '10:55:01' },
  { id: 'e41', source: 'TX-98402', target: 'M-Gift', relationship: 'targeted_merchant', weight: 1.0, firstSeen: '10:55:01', lastSeen: '10:55:01' },
  { id: 'e42', source: 'C120', target: 'TX-98390', relationship: 'initiated_tx', weight: 1.0, firstSeen: '10:50:33', lastSeen: '10:50:33' },
  { id: 'e43', source: 'TX-98390', target: 'M-Nova', relationship: 'targeted_merchant', weight: 1.0, firstSeen: '10:50:33', lastSeen: '10:50:33' }
];

// At least 18 recent transactions with INR conversion (1$ = 94.45 ₹)
export const MOCK_TRANSACTIONS: TransactionRecord[] = [
  {
    id: 'TX-98421',
    customerId: 'C107',
    merchantId: 'M-Gift',
    merchantName: 'QuickPerks GiftCards India',
    amount: 47178, // $499.50 * 94.45
    timestamp: '2026-09-04 10:59:44',
    deviceId: 'Device-17',
    ipId: 'IP-07',
    addressId: 'Address-12',
    instrumentId: 'Instrument-4',
    status: 'BLOCKED',
    riskScore: 0.96,
    riskBand: 'CRITICAL',
    action: 'BLOCK',
    ringId: 'RING-017',
    evidence: [
      { signal: 'device_customer_count', value: '14 customers on 1 device', contribution: 0.38, severity: 'critical', explanation: 'Same hardware canvas fingerprint mapped to 14 discrete accounts within 47 minutes.' },
      { signal: 'instrument_customer_count', value: '4 accounts on 1 card', contribution: 0.28, severity: 'critical', explanation: 'Prepaid card reuse across 4 distinct customer identity records.' },
      { signal: 'velocity_burst_10m', value: '19 tx / 10m', contribution: 0.20, severity: 'high', explanation: 'Transaction speed 34x baseline standard deviation.' },
      { signal: 'ip_tor_relay', value: 'Known Tor relay ASN', contribution: 0.10, severity: 'high', explanation: 'Connection routed through flagged anonymizing proxy.' }
    ]
  },
  {
    id: 'TX-98419',
    customerId: 'C101',
    merchantId: 'M-Cloud',
    merchantName: 'ByteWave Cloud Credits',
    amount: 46753, // $495.00 * 94.45
    timestamp: '2026-09-04 10:58:19',
    deviceId: 'Device-17',
    ipId: 'IP-07',
    addressId: 'Address-12',
    instrumentId: 'Instrument-4',
    status: 'HELD',
    riskScore: 0.94,
    riskBand: 'CRITICAL',
    action: 'HOLD',
    ringId: 'RING-017',
    evidence: [
      { signal: 'amount_similarity_clustering', value: '₹46,753 repeated', contribution: 0.32, severity: 'high', explanation: 'Clustered micro-variations just below ₹47,225 limit.' },
      { signal: 'device_customer_count', value: '14 customers', contribution: 0.38, severity: 'critical', explanation: 'Shared device with 13 prior synchronized registrations.' },
      { signal: 'account_age_at_tx', value: '38 minutes', contribution: 0.24, severity: 'high', explanation: 'Transaction occurred moments after bulk automated signup.' }
    ]
  },
  {
    id: 'TX-98402',
    customerId: 'C103',
    merchantId: 'M-Gift',
    merchantName: 'QuickPerks GiftCards India',
    amount: 47225, // $500.00 * 94.45
    timestamp: '2026-09-04 10:55:01',
    deviceId: 'Device-17',
    ipId: 'IP-08',
    addressId: 'Address-12',
    instrumentId: 'Instrument-5',
    status: 'HELD',
    riskScore: 0.93,
    riskBand: 'CRITICAL',
    action: 'HOLD',
    ringId: 'RING-017',
    evidence: [
      { signal: 'graph_cluster_density', value: 'Density 0.84', contribution: 0.36, severity: 'critical', explanation: 'High bipartite connectivity with known fraud cluster.' },
      { signal: 'ip_vpn_detection', value: 'Datacenter IP', contribution: 0.18, severity: 'medium', explanation: 'Hosted proxy IP range.' }
    ]
  },
  {
    id: 'TX-98390',
    customerId: 'C120',
    merchantId: 'M-Nova',
    merchantName: 'Nova Crypto Remit Gateway',
    amount: 46281, // $490.00 * 94.45
    timestamp: '2026-09-04 10:50:33',
    deviceId: 'Device-31',
    ipId: 'IP-21',
    addressId: 'Address-14',
    instrumentId: 'Instrument-9',
    status: 'BLOCKED',
    riskScore: 0.95,
    riskBand: 'CRITICAL',
    action: 'BLOCK',
    ringId: 'RING-017',
    evidence: [
      { signal: 'botnet_scraper_header', value: 'Automated Headless User-Agent', contribution: 0.40, severity: 'critical', explanation: 'Linux server host running parallel scripted payment curls.' }
    ]
  },
  {
    id: 'TX-98375',
    customerId: 'C115',
    merchantId: 'M-PayZ',
    merchantName: 'PayZ Gaming Topups',
    amount: 45808, // $485.00 * 94.45
    timestamp: '2026-09-04 10:48:10',
    deviceId: 'Device-22',
    ipId: 'IP-14',
    addressId: 'Address-15',
    instrumentId: 'Instrument-8',
    status: 'HELD',
    riskScore: 0.91,
    riskBand: 'CRITICAL',
    action: 'HOLD',
    ringId: 'RING-024',
    evidence: [
      { signal: 'shared_virtual_wallet', value: 'Prepaid Wallet overlap', contribution: 0.34, severity: 'high', explanation: 'PayTM burner wallet linked to 3 accounts.' }
    ]
  },
  {
    id: 'TX-98360',
    customerId: 'C116',
    merchantId: 'M-PayZ',
    merchantName: 'PayZ Gaming Topups',
    amount: 46500, // $492.32 * 94.45
    timestamp: '2026-09-04 10:46:25',
    deviceId: 'Device-22',
    ipId: 'IP-14',
    addressId: 'Address-15',
    instrumentId: 'Instrument-8',
    status: 'HELD',
    riskScore: 0.90,
    riskBand: 'CRITICAL',
    action: 'HOLD',
    ringId: 'RING-024',
    evidence: [
      { signal: 'device_velocity', value: '8 tx/hour on Device-22', contribution: 0.28, severity: 'high', explanation: 'Burst gaming topup velocity.' }
    ]
  },
  {
    id: 'TX-98344',
    customerId: 'C118',
    merchantId: 'M-Cloud',
    merchantName: 'ByteWave Cloud Credits',
    amount: 35891, // $380.00 * 94.45
    timestamp: '2026-09-04 10:42:15',
    deviceId: 'Device-09',
    ipId: 'IP-14',
    addressId: 'Address-13',
    instrumentId: 'Instrument-6',
    status: 'REVIEW',
    riskScore: 0.85,
    riskBand: 'HIGH',
    action: 'REVIEW',
    ringId: 'RING-012',
    evidence: [
      { signal: 'emulator_fingerprint', value: 'Bluestacks container', contribution: 0.30, severity: 'high', explanation: 'Virtual Android runtime environment.' }
    ]
  },
  {
    id: 'TX-98330',
    customerId: 'C119',
    merchantId: 'M-Cloud',
    merchantName: 'ByteWave Cloud Credits',
    amount: 36741, // $389.00 * 94.45
    timestamp: '2026-09-04 10:40:02',
    deviceId: 'Device-09',
    ipId: 'IP-14',
    addressId: 'Address-13',
    instrumentId: 'Instrument-6',
    status: 'REVIEW',
    riskScore: 0.84,
    riskBand: 'HIGH',
    action: 'REVIEW',
    ringId: 'RING-012',
    evidence: [
      { signal: 'circular_sub_merchant', value: 'Collusion cluster', contribution: 0.32, severity: 'high', explanation: 'Credit cycling between related sub-merchants.' }
    ]
  },
  {
    id: 'TX-98312',
    customerId: 'C110',
    merchantId: 'M-Gift',
    merchantName: 'QuickPerks GiftCards India',
    amount: 47100, // $498.67 * 94.45
    timestamp: '2026-09-04 10:38:40',
    deviceId: 'Device-17',
    ipId: 'IP-07',
    addressId: 'Address-12',
    instrumentId: 'Instrument-4',
    status: 'BLOCKED',
    riskScore: 0.94,
    riskBand: 'CRITICAL',
    action: 'BLOCK',
    ringId: 'RING-017',
    evidence: [
      { signal: 'card_reuse_burst', value: 'Instrument-4 reused', contribution: 0.35, severity: 'critical', explanation: 'Card shared with C101, C102, C107.' }
    ]
  },
  {
    id: 'TX-98290',
    customerId: 'C114',
    merchantId: 'M-Nova',
    merchantName: 'Nova Crypto Remit Gateway',
    amount: 46800, // $495.50 * 94.45
    timestamp: '2026-09-04 10:35:10',
    deviceId: 'Device-17',
    ipId: 'IP-08',
    addressId: 'Address-12',
    instrumentId: 'Instrument-5',
    status: 'HELD',
    riskScore: 0.92,
    riskBand: 'CRITICAL',
    action: 'HOLD',
    ringId: 'RING-017',
    evidence: [
      { signal: 'tor_routing_gateway', value: 'Tor Exit relay', contribution: 0.28, severity: 'high', explanation: 'Encrypted multi-hop traffic node.' }
    ]
  },
  {
    id: 'TX-98270',
    customerId: 'C121',
    merchantId: 'M-Apex',
    merchantName: 'Apex Electronics Express',
    amount: 23612, // $250.00 * 94.45
    timestamp: '2026-09-04 10:30:19',
    deviceId: 'Device-22',
    ipId: 'IP-14',
    addressId: 'Address-16',
    instrumentId: 'Instrument-7',
    status: 'REVIEW',
    riskScore: 0.74,
    riskBand: 'HIGH',
    action: 'REVIEW',
    ringId: 'RING-009',
    evidence: [
      { signal: 'credential_stuffing_wave', value: 'Rapid failed login sequence', contribution: 0.25, severity: 'medium', explanation: '5 prior credential mismatches before success.' }
    ]
  },
  {
    id: 'TX-98255',
    customerId: 'C122',
    merchantId: 'M-Apex',
    merchantName: 'Apex Electronics Express',
    amount: 22195, // $235.00 * 94.45
    timestamp: '2026-09-04 10:28:44',
    deviceId: 'Device-22',
    ipId: 'IP-14',
    addressId: 'Address-16',
    instrumentId: 'Instrument-7',
    status: 'REVIEW',
    riskScore: 0.72,
    riskBand: 'HIGH',
    action: 'REVIEW',
    ringId: 'RING-009',
    evidence: [
      { signal: 'address_mismatch', value: 'Postal code mismatch', contribution: 0.22, severity: 'medium', explanation: 'Shipping address differs from card issuance pin code.' }
    ]
  },
  {
    id: 'TX-98230',
    customerId: 'C104',
    merchantId: 'M-Gift',
    merchantName: 'QuickPerks GiftCards India',
    amount: 47225, // $500.00 * 94.45
    timestamp: '2026-09-04 10:24:12',
    deviceId: 'Device-17',
    ipId: 'IP-08',
    addressId: 'Address-13',
    instrumentId: 'Instrument-5',
    status: 'HELD',
    riskScore: 0.91,
    riskBand: 'CRITICAL',
    action: 'HOLD',
    ringId: 'RING-017',
    evidence: [
      { signal: 'velocity_burst', value: 'High transaction frequency', contribution: 0.30, severity: 'high', explanation: 'Automated script payload.' }
    ]
  },
  {
    id: 'TX-98210',
    customerId: 'C105',
    merchantId: 'M-Gift',
    merchantName: 'QuickPerks GiftCards India',
    amount: 46990, // $497.51 * 94.45
    timestamp: '2026-09-04 10:20:00',
    deviceId: 'Device-17',
    ipId: 'IP-07',
    addressId: 'Address-13',
    instrumentId: 'Instrument-6',
    status: 'HELD',
    riskScore: 0.90,
    riskBand: 'CRITICAL',
    action: 'HOLD',
    ringId: 'RING-017',
    evidence: [
      { signal: 'structured_amount', value: 'Sub-₹50,000 structuring', contribution: 0.26, severity: 'high', explanation: 'Evading regulatory KYC declaration barrier.' }
    ]
  },
  {
    id: 'TX-98180',
    customerId: 'C-Norm-88',
    merchantId: 'M-Apex',
    merchantName: 'Apex Electronics Express',
    amount: 3976, // $42.10 * 94.45
    timestamp: '2026-09-04 10:15:20',
    deviceId: 'Dev-Regular-11',
    ipId: 'IP-Residential-3',
    addressId: 'Addr-Residential-5',
    instrumentId: 'Card-Prime-9',
    status: 'ALLOWED',
    riskScore: 0.08,
    riskBand: 'LOW',
    action: 'ALLOW',
    evidence: [
      { signal: 'tenure_loyalty', value: '4 years verified', contribution: -0.25, severity: 'low', explanation: 'Verified customer with pristine history.' }
    ]
  },
  {
    id: 'TX-98160',
    customerId: 'C-Norm-92',
    merchantId: 'M-Apex',
    merchantName: 'Apex Electronics Express',
    amount: 10626, // $112.50 * 94.45
    timestamp: '2026-09-04 10:10:05',
    deviceId: 'Dev-Regular-22',
    ipId: 'IP-Residential-8',
    addressId: 'Addr-Residential-9',
    instrumentId: 'Card-Prime-12',
    status: 'ALLOWED',
    riskScore: 0.14,
    riskBand: 'LOW',
    action: 'ALLOW',
    evidence: [
      { signal: 'trusted_device', value: 'Matched 98 logins', contribution: -0.20, severity: 'low', explanation: 'Biometric passkey verified.' }
    ]
  },
  {
    id: 'TX-98140',
    customerId: 'C-Norm-95',
    merchantId: 'M-Cloud',
    merchantName: 'ByteWave Cloud Credits',
    amount: 8450, // $89.46 * 94.45
    timestamp: '2026-09-04 10:05:14',
    deviceId: 'Dev-Regular-33',
    ipId: 'IP-Residential-12',
    addressId: 'Addr-Residential-14',
    instrumentId: 'Card-Prime-15',
    status: 'ALLOWED',
    riskScore: 0.11,
    riskBand: 'LOW',
    action: 'ALLOW',
    evidence: [
      { signal: 'standard_consumer', value: 'Routine monthly billing', contribution: -0.18, severity: 'low', explanation: 'Recurring subscription profile.' }
    ]
  },
  {
    id: 'TX-98115',
    customerId: 'C-Norm-99',
    merchantId: 'M-PayZ',
    merchantName: 'PayZ Gaming Topups',
    amount: 1416, // $15.00 * 94.45
    timestamp: '2026-09-04 09:58:30',
    deviceId: 'Dev-Regular-44',
    ipId: 'IP-Residential-19',
    addressId: 'Addr-Residential-20',
    instrumentId: 'Card-Prime-19',
    status: 'ALLOWED',
    riskScore: 0.05,
    riskBand: 'LOW',
    action: 'ALLOW',
    evidence: [
      { signal: 'micropayment_valid', value: 'Standard in-game purchase', contribution: -0.22, severity: 'low', explanation: 'Consistent player behavior.' }
    ]
  }
];

// Rich Cases categorized by Critical, High, Medium Priority
export const MOCK_CASES: RiskCase[] = [
  // 1. Critical Priority
  {
    id: 'CASE-RING-017',
    title: 'Ring #17 Coordinated Infrastructure & Velocity Abuse',
    customerIds: ['C101', 'C102', 'C103', 'C104', 'C105', 'C107', 'C110', 'C114', 'C120'],
    priority: 'CRITICAL',
    status: 'INVESTIGATING',
    ringId: 'RING-017',
    assignedAnalyst: 'Sarah Chen (Lead Fraud Sentinel)',
    createdAt: '2026-09-04 10:12:00',
    openedAt: '2026-09-04 10:20:12',
    updatedAt: '2026-09-04 10:59:44',
    totalTransactions: 83,
    totalVolume: 3895118, // $41,240 * 94.45 = ₹38,95,118
    suspiciousEntitiesCount: 27,
    suspectedPattern: 'Shared Device + Synthetic Virtual Cards + High-Velocity 47-min Burst',
    timeline: [
      { timestamp: '10:12:04', title: 'First Registration Burst', description: 'C101 registered via Device-17 through Datacenter IP 198.51.100.44', actor: 'System' },
      { timestamp: '10:19:10', title: 'Hardware Fingerprint Overlap', description: 'Device-17 reached 7 linked accounts threshold; flagged in graph database', actor: 'Graph Sentinel' },
      { timestamp: '10:20:12', title: 'Case Opened Automatically', description: 'Risk score exceeded 0.90 threshold; automated incident case dispatched to Sarah Chen', actor: 'Nhost Functions' },
      { timestamp: '10:35:40', title: 'Tor Relay Traffic Influx', description: 'Second wave of transactions initiated through Tor Exit Node IP 203.0.113.88', actor: 'Network Monitor' },
      { timestamp: '10:55:01', title: 'High-Volume Card Testing', description: '19 transactions submitted within 10 minutes targeting QuickPerks and ByteWave', actor: 'Velocity Engine' },
      { timestamp: '10:59:44', title: 'Automated Block Enforced', description: 'Gateway automatically rejected Tx #98421 and blocked hardware Device-17', actor: 'Policy Engine' }
    ],
    linkedEntities: [
      { type: 'device', id: 'Device-17', label: 'Device #17 (macOS / Safari 18.2 Fingerprint df82a)', riskScore: 0.96 },
      { type: 'payment_instrument', id: 'Instrument-4', label: 'Visa ending 8812 (Virtual Prepaid)', riskScore: 0.95 },
      { type: 'payment_instrument', id: 'Instrument-5', label: 'Mastercard ending 4409 (Revolut Disposable)', riskScore: 0.92 },
      { type: 'ip', id: 'IP-07', label: 'IP 198.51.100.44 (Datacenter VPN - DigitalOcean)', riskScore: 0.91 },
      { type: 'ip', id: 'IP-08', label: 'IP 203.0.113.88 (Tor Exit Relay Node #41)', riskScore: 0.98 },
      { type: 'address', id: 'Address-12', label: '742 Evergreen Terrace, Suite 4B, Bengaluru', riskScore: 0.88 },
      { type: 'merchant', id: 'M-Gift', label: 'QuickPerks GiftCards India', riskScore: 0.84 }
    ],
    notes: [
      'Synchronized bulk registrations identified across 14 disposable webmail domains.',
      'Device #17 exhibits identical canvas & WebGL telemetry fingerprint despite rotating browser user agents.',
      'All 83 transactions concentrated on digital gift cards & liquid cloud compute credits.'
    ],
    aiSummary: {
      riskSummary: 'Coordinated syndicate attack detected across 14 accounts originating from a single hardware device (Device-17) routed through Tor and Datacenter VPN proxies.',
      strongestEvidence: [
        '14 discrete customer accounts sharing identical hardware fingerprint (Device-17)',
        'Prepaid card instrument (ending 8812) recycled across 4 distinct customer accounts',
        'Burst velocity: 83 transactions totalling ₹38,95,118 completed within a 47-minute window',
        'Clustered transaction values hovering between ₹46,000 and ₹47,225 to evade single-item regulatory review limits'
      ],
      suspectedCoordinationPattern: 'Automated Account Generation + Scripted Velocity Card Testing with Virtual Disposable PANs.',
      analystQuestions: [
        'Has 3DS verification been enforced for merchant QuickPerks GiftCards India?',
        'Are there collateral dormant accounts active on IP-07 (198.51.100.44) awaiting instructions?',
        'Can Device-17 fingerprint be quarantined at the reverse proxy ingress layer?'
      ],
      recommendedNextStep: 'Enforce immediate BLOCK policy on Device-17, freeze remaining 8 pending authorizations, and submit BIN 414720 rule update.',
      uncertaintyNotes: 'No evidence of legitimate end-user traffic on Device-17; confidence score in coordinated abuse is 98.4%.'
    }
  },
  {
    id: 'CASE-RING-024',
    title: 'Ring #24 Automated Prepaid Topup Syndicate',
    customerIds: ['C115', 'C116', 'C117'],
    priority: 'CRITICAL',
    status: 'NEW',
    ringId: 'RING-024',
    assignedAnalyst: 'Unassigned (Queue Lead)',
    createdAt: '2026-09-04 10:28:00',
    openedAt: '2026-09-04 10:32:15',
    updatedAt: '2026-09-04 10:48:10',
    totalTransactions: 31,
    totalVolume: 1420500, // ₹14,20,500
    suspiciousEntitiesCount: 11,
    suspectedPattern: 'Headless Browser Automation + Shared Digital Wallets on Residential Proxies',
    timeline: [
      { timestamp: '10:28:00', title: 'Headless Browser Session Detected', description: 'Device-22 logged in via automated Selenium driver signature', actor: 'Bot Detector' },
      { timestamp: '10:32:15', title: 'Shared Wallet Identified', description: 'PayTM Prepaid Wallet ending 9112 bound to 3 new customer profiles', actor: 'Entity Resolver' },
      { timestamp: '10:48:10', title: 'Multiple Topups Held', description: '3 topup payments routed to HOLD pending identity verification', actor: 'Policy Engine' }
    ],
    linkedEntities: [
      { type: 'device', id: 'Device-22', label: 'Device #22 (Automated Chromium Headless)', riskScore: 0.93 },
      { type: 'payment_instrument', id: 'Instrument-8', label: 'PayTM Prepaid Wallet ending 9112', riskScore: 0.91 },
      { type: 'ip', id: 'IP-14', label: 'IP 45.33.22.119 (Residential Proxy Mesh)', riskScore: 0.86 }
    ],
    notes: [
      'Rapid fire wallet reload requests from residential proxy pool in Hyderabad.'
    ]
  },

  // 2. High Priority
  {
    id: 'CASE-RING-012',
    title: 'Ring #12 Merchant Collusion & Cashback Cycling',
    customerIds: ['C118', 'C119'],
    priority: 'HIGH',
    status: 'TRIAGED',
    ringId: 'RING-012',
    assignedAnalyst: 'Michael Torres',
    createdAt: '2026-09-04 08:14:00',
    openedAt: '2026-09-04 08:30:00',
    updatedAt: '2026-09-04 10:42:15',
    totalTransactions: 42,
    totalVolume: 1785105, // $18,900 * 94.45 = ₹17,85,105
    suspiciousEntitiesCount: 16,
    suspectedPattern: 'Circular payment routing with 8 accounts sharing 2 residential IP gateways.',
    timeline: [
      { timestamp: '08:14:00', title: 'Circular Transaction Route', description: 'Funds routed between ByteWave and sub-merchants without goods dispatch', actor: 'Graph Engine' },
      { timestamp: '08:30:00', title: 'Case Triaged', description: 'Assigned to Michael Torres for commercial review', actor: 'Analyst Lead' }
    ],
    linkedEntities: [
      { type: 'device', id: 'Device-09', label: 'Device #09 (Android Emulator Bluestacks)', riskScore: 0.88 },
      { type: 'payment_instrument', id: 'Instrument-6', label: 'RuPay ending 1004 (Token PAN)', riskScore: 0.89 },
      { type: 'merchant', id: 'M-Cloud', label: 'ByteWave Cloud Credits', riskScore: 0.62 }
    ],
    notes: [
      'Transactions appear to bounce between two sub-merchants with zero inventory dispatch.'
    ]
  },
  {
    id: 'CASE-RING-019',
    title: 'Ring #19 Crypto Remittance Velocity Spikes',
    customerIds: ['C120'],
    priority: 'HIGH',
    status: 'INVESTIGATING',
    ringId: 'RING-019',
    assignedAnalyst: 'Vikram Mehta',
    createdAt: '2026-09-04 09:10:00',
    openedAt: '2026-09-04 09:25:00',
    updatedAt: '2026-09-04 10:50:33',
    totalTransactions: 22,
    totalVolume: 1018270, // ₹10,18,270
    suspiciousEntitiesCount: 8,
    suspectedPattern: 'Scraper Botnet dispatching small cross-border crypto remittances',
    timeline: [
      { timestamp: '09:10:00', title: 'Server Botnet Detected', description: 'Device-31 Linux server script initiated 12 rapid remittances', actor: 'Gateway' },
      { timestamp: '09:25:00', title: 'Case Opened', description: 'Flagged for anti-money laundering review', actor: 'System' }
    ],
    linkedEntities: [
      { type: 'device', id: 'Device-31', label: 'Device #31 (Linux Ubuntu Server Scraper)', riskScore: 0.95 },
      { type: 'merchant', id: 'M-Nova', label: 'Nova Crypto Remit Gateway', riskScore: 0.89 }
    ],
    notes: [
      'Remittances initiated with prepaid forex card ending 7730.'
    ]
  },

  // 3. Medium Priority
  {
    id: 'CASE-RING-009',
    title: 'Ring #09 Account Takeover Wave via Leaked Credential Stuffing',
    customerIds: ['C121', 'C122'],
    priority: 'MEDIUM',
    status: 'RESOLVED',
    ringId: 'RING-009',
    assignedAnalyst: 'Sarah Chen',
    createdAt: '2026-09-03 14:00:00',
    openedAt: '2026-09-03 14:15:00',
    updatedAt: '2026-09-03 18:22:00',
    totalTransactions: 19,
    totalVolume: 793380, // $8,400 * 94.45 = ₹7,93,380
    suspiciousEntitiesCount: 9,
    suspectedPattern: 'Cred-stuffing attack stopped after automated step-up MFA challenge.',
    timeline: [
      { timestamp: '14:00:00', title: 'Credential Stuffing Burst', description: '5 failed password attempts across 8 accounts in 2 minutes', actor: 'Auth Sentinel' },
      { timestamp: '14:15:00', title: 'Step-Up MFA Enforced', description: 'All affected sessions forced into biometric passkey / SMS OTP verification', actor: 'Auth Sentinel' },
      { timestamp: '18:22:00', title: 'Case Resolved', description: 'Attack mitigated with zero customer account takeovers', actor: 'Sarah Chen' }
    ],
    linkedEntities: [
      { type: 'device', id: 'Device-22', label: 'Device #22 (Chromium Script)', riskScore: 0.93 },
      { type: 'payment_instrument', id: 'Instrument-7', label: 'Visa ending 3391', riskScore: 0.87 }
    ],
    notes: [
      'Customer accounts safeguarded. 18 step-up MFA challenges successfully triggered.'
    ]
  },
  {
    id: 'CASE-RING-005',
    title: 'Ring #05 Velocity Micro-Testing on Electronics',
    customerIds: ['C114'],
    priority: 'MEDIUM',
    status: 'RESOLVED',
    ringId: 'RING-005',
    assignedAnalyst: 'David Kumar',
    createdAt: '2026-09-02 11:30:00',
    openedAt: '2026-09-02 11:45:00',
    updatedAt: '2026-09-02 15:10:00',
    totalTransactions: 12,
    totalVolume: 425025, // ₹4,25,025
    suspiciousEntitiesCount: 5,
    suspectedPattern: 'Sub-₹5,000 card validity testing bursts on accessories',
    timeline: [
      { timestamp: '11:30:00', title: 'Micro-Testing Flagged', description: 'Rapid small authorizations on Apex Electronics', actor: 'Velocity Rule' },
      { timestamp: '15:10:00', title: 'Resolved - Card Expired', description: 'Card issuer blocked card; customer confirmed false authorization', actor: 'David Kumar' }
    ],
    linkedEntities: [
      { type: 'merchant', id: 'M-Apex', label: 'Apex Electronics Express', riskScore: 0.45 }
    ],
    notes: [
      'No loss incurred; BIN blocked at payment gateway.'
    ]
  }
];

export const ACTIVE_POLICY: PolicyConfig = {
  id: 'POL-2026-V3',
  version: 'v3.2-production',
  name: 'Balanced Sentinel Standard (Razorpay Track 2 Calibrated)',
  active: true,
  reviewThreshold: 0.70,
  holdThreshold: 0.85,
  blockThreshold: 0.90,
  weights: {
    ml: 0.40,
    graph: 0.35,
    behaviour: 0.15,
    rules: 0.10
  },
  rules: {
    maxCustomersPerDevice: 3,
    maxVelocityPerHour: 12,
    amountSimilarityThreshold: 0.88
  }
};

// Evaluation Data in INR (1$ = 94.45 ₹)
export const EVALUATION_DATA: EvaluationRunMetrics = {
  runId: 'RUN-HELD-OUT-TEST-86-100',
  modelVersion: 'v1', // Model version v1 as requested
  featureVersion: 'feat-v2.9.1-networkx',
  datasetVersion: 'syn-buildathon-30k-rings-086-100',
  heldOutRings: 'Rings 086 to 100 (15 Isolated Held-Out Rings, 5,000 Test Set)',
  precision: 0.685, // 68.5% (between 60% and 70%)
  recall: 0.640,    // 64.0% (between 60% and 70%)
  f1: 0.662,        // 66.2% (between 60% and 70%)
  fpCount: 86,
  fnCount: 105,
  tpCount: 187,
  tnCount: 4622,
  estimatedLossAvoided: 18724000, // ₹1,87,24,000 fraud avoided in test set
  reviewCost: 198500,             // Review operational cost
  netCostEfficiency: 18525500,    // Net savings vs legacy rules
  baseline: {
    name: 'Rules Baseline',
    precision: 0.492, // 49.2%
    recall: 0.435,    // 43.5%
    f1: 0.461,        // 46.1%
    fpCount: 168,
    fnCount: 165
  }
};

export const INITIAL_AUDIT_TRAIL: AuditEvent[] = [
  {
    id: 'AUD-891',
    timestamp: '2026-09-04 10:59:45',
    actor: 'RiskGraph-Orchestrator',
    eventType: 'AUTO_BLOCK_TRIGGERED',
    entityType: 'transaction',
    entityId: 'TX-98421',
    summary: 'Score 0.96 > Policy Block Threshold 0.90. Transaction automatically BLOCKED (₹47,178).',
    metadata: { ringId: 'RING-017', model: 'v1', policy: 'v3.2-production' }
  },
  {
    id: 'AUD-890',
    timestamp: '2026-09-04 10:58:20',
    actor: 'RiskGraph-Orchestrator',
    eventType: 'AUTO_HOLD_TRIGGERED',
    entityType: 'transaction',
    entityId: 'TX-98419',
    summary: 'Score 0.94 > Policy Hold Threshold 0.85. Transaction routed to HOLD (₹46,753).',
    metadata: { ringId: 'RING-017' }
  },
  {
    id: 'AUD-889',
    timestamp: '2026-09-04 10:45:10',
    actor: 'Sarah Chen',
    eventType: 'CASE_STATUS_CHANGE',
    entityType: 'case',
    entityId: 'CASE-RING-017',
    summary: 'Case marked as INVESTIGATING by analyst. Evidence pack materialized.',
    metadata: { previousStatus: 'NEW', newStatus: 'INVESTIGATING' }
  }
];
