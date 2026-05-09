
// ================================================
//  REAL MULTI-WALLET EVM CONNECT
//  Works with: MetaMask, Coinbase, Brave, OKX,
//              Rabby, Trust Wallet + any EIP-1193
// ================================================
const CONTRACT_ADDRESS = "0x9dE763AA859AD6642d84B66bF5Ce8e93946858b7";

const CONTRACT_ABI = [
  {
    "inputs": [],
    "name": "mint",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
];
const RITUAL_CHAIN = {
  chainId: '0x7BB',
  chainName: 'Ritual Chain',
  nativeCurrency: { name: 'RITUAL', symbol: 'RITUAL', decimals: 18 },
  rpcUrls: ['https://rpc.ritualfoundation.org'],
  blockExplorerUrls: ['https://explorer.ritualfoundation.org']
};

const WALLET_DEFS = [
  {
    id: 'metamask',
    name: 'MetaMask',
    desc: 'Most popular EVM wallet',
    iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg',
    iconBg: 'linear-gradient(135deg,#e8821a,#f6851b)',
    installUrl: 'https://metamask.io/download/',
    detect() {
      if (window.ethereum?.providers) {
        return window.ethereum.providers.find(p => p.isMetaMask && !p.isBraveWallet && !p.isRabby);
      }
      if (window.ethereum?.isMetaMask && !window.ethereum?.isBraveWallet && !window.ethereum?.isRabby) return window.ethereum;
      return null;
    }
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    desc: 'Simple & secure crypto wallet',
    iconUrl: 'https://images.ctfassets.net/q5ulk4bp65r7/1kH3XSQv1gdnxMcDnKD6DM/c36af5dce4df4fd8cdf9e527b6f53580/wallet-logo-circle-blue.png',
    iconBg: 'linear-gradient(135deg,#0052ff,#1464fb)',
    installUrl: 'https://www.coinbase.com/wallet/downloads',
    detect() {
      if (window.ethereum?.providers) return window.ethereum.providers.find(p => p.isCoinbaseWallet);
      return window.coinbaseWalletExtension || (window.ethereum?.isCoinbaseWallet ? window.ethereum : null);
    }
  },
  {
    id: 'brave',
    name: 'Brave Wallet',
    desc: 'Built into Brave browser',
    iconUrl: 'https://brave.com/static-assets/images/brave-logo-sans-text.svg',
    iconBg: 'linear-gradient(135deg,#ff3d00,#ff5722)',
    installUrl: 'https://brave.com/download/',
    detect() {
      if (window.ethereum?.isBraveWallet) return window.ethereum;
      if (window.ethereum?.providers) return window.ethereum.providers.find(p => p.isBraveWallet);
      return null;
    }
  },
  {
    id: 'okx',
    name: 'OKX Wallet',
    desc: 'Web3 wallet by OKX Exchange',
    iconUrl: 'https://static.okx.com/cdn/assets/imgs/247/58E63FEA47A2B7D7.png',
    iconBg: 'linear-gradient(135deg,#1a1a1a,#333)',
    installUrl: 'https://www.okx.com/web3',
    detect() { return window.okxwallet || null; }
  },
  {
    id: 'rabby',
    name: 'Rabby Wallet',
    desc: 'Security-focused Ethereum wallet',
    iconUrl: 'https://rabby.io/assets/images/logo-white.svg',
    iconBg: 'linear-gradient(135deg,#7084ff,#5b6ef7)',
    installUrl: 'https://rabby.io/',
    detect() {
      if (window.ethereum?.isRabby) return window.ethereum;
      if (window.ethereum?.providers) return window.ethereum.providers.find(p => p.isRabby);
      return null;
    }
  },
  {
    id: 'trust',
    name: 'Trust Wallet',
    desc: 'Multi-chain mobile & extension',
    iconUrl: 'https://trustwallet.com/assets/images/trust_platform.svg',
    iconBg: 'linear-gradient(135deg,#3375bb,#1b60a8)',
    installUrl: 'https://trustwallet.com/browser-extension',
    detect() {
      return window.trustwallet || (window.ethereum?.isTrust ? window.ethereum : null) ||
        (window.ethereum?.providers ? window.ethereum.providers.find(p => p.isTrust) : null);
    }
  }
];

// State
let _provider = null;
let _walletId = null;

// ---------- UI ----------
function shortAddr(a) { return a ? a.slice(0,6)+'...'+a.slice(-4) : ''; }

function setUIConnected(addr, walletId) {
  const w = WALLET_DEFS.find(x => x.id === walletId);
  const btn = document.getElementById('customConnectBtn');
  const dis = document.getElementById('customDisconnectBtn');
  const cardBtn = document.getElementById('cardConnectBtn');
  const status = document.getElementById('walletStatus');

  if (addr) {
    const short = shortAddr(addr);
    const ico = w ? `<img src="${w.iconUrl}" style="width:15px;height:15px;border-radius:3px;object-fit:contain;vertical-align:middle;" onerror="this.style.display='none'"> ` : '';
    btn.className = 'btn-wallet-nav connected';
    btn.innerHTML = `<svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor"><circle cx="4" cy="4" r="4"/></svg>${ico}${short}`;
    dis.classList.add('show');
    if (cardBtn) { cardBtn.textContent = 'Disconnect'; cardBtn.onclick = handleDisconnect; }
    if (status) { status.className = 'wallet-status connected'; status.innerHTML = `<span class="status-dot"></span> ${short} · Ritual Chain`; }
    window.__walletConnected = true;
    window.__walletAddress = addr;
    randomNFT();
  } else {
    btn.className = 'btn-wallet-nav';
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v1H2V5zm0 3h16v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8zm11 3a1 1 0 100 2h2a1 1 0 100-2h-2z"/></svg> Connect Wallet`;
    dis.classList.remove('show');
    if (cardBtn) { cardBtn.textContent = 'Connect'; cardBtn.onclick = handleConnectClick; }
    if (status) { status.className = 'wallet-status'; status.innerHTML = '<span class="status-dot"></span> Wallet Not Connected'; }
    window.__walletConnected = false;
    window.__walletAddress = null;
    _provider = null; _walletId = null;
  }
}

// ---------- Modal ----------
function handleConnectClick() { openWalletModal(); }

function openWalletModal() {
  buildWalletList();
  wcShowList();
  document.getElementById('wcBackdrop').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeWalletModal() {
  document.getElementById('wcBackdrop').classList.remove('open');
  document.body.style.overflow = '';
}

function wcShowList() {
  document.getElementById('wcListView').style.display = '';
  document.getElementById('wcConnView').classList.remove('active');
}

function wcShowConnecting(w) {
  document.getElementById('wcListView').style.display = 'none';
  document.getElementById('wcConnView').classList.add('active');
  document.getElementById('wcConnName').textContent = w.name;
  document.getElementById('wcConnMsg').textContent = 'Approve the connection in your wallet.';
  const sp = document.getElementById('wcSpinner');
  sp.style.background = w.iconBg;
  sp.innerHTML = `<img src="${w.iconUrl}" style="width:28px;height:28px;border-radius:7px;object-fit:contain;" onerror="this.style.display='none'">`;
}

function buildWalletList() {
  const container = document.getElementById('wcWalletBtns');
  container.innerHTML = '';

  let anyDetected = false;
  WALLET_DEFS.forEach(w => {
    const provider = w.detect();
    const detected = !!provider;
    if (detected) anyDetected = true;

    const btn = document.createElement('button');
    btn.className = 'wc-wallet-btn';
    btn.innerHTML = `
      <div class="wc-wallet-icon" style="background:${w.iconBg}">
        <img src="${w.iconUrl}" onerror="this.parentElement.innerHTML='<span style=font-size:22px>💼</span>'"/>
      </div>
      <div class="wc-wallet-info">
        <div class="wc-wallet-name">${w.name}</div>
        <div class="wc-wallet-desc">${detected ? '✓ Extension detected' : w.desc}</div>
      </div>
      ${detected
        ? `<span class="wc-wallet-tag green">Detected</span><div class="wc-installed-dot"></div>`
        : `<span class="wc-wallet-tag">Install</span>`}
    `;

    if (detected) {
      btn.onclick = () => connectWallet(w);
    } else {
      btn.onclick = () => { window.open(w.installUrl,'_blank'); showToast(`Install ${w.name}, then refresh.`); };
    }
    container.appendChild(btn);
  });

  if (!anyDetected) {
    const hint = document.createElement('div');
    hint.className = 'wc-no-wallet';
    hint.innerHTML = `⚠️ No EVM wallet extension detected in your browser.<br>Install <a href="https://metamask.io/download/" target="_blank" style="color:#6378ff">MetaMask</a> or another wallet, then refresh this page.`;
    container.prepend(hint);
  }
}

// ---------- Connect ----------
async function connectWallet(w) {
  const provider = w.detect();
  if (!provider) { window.open(w.installUrl,'_blank'); return; }

  wcShowConnecting(w);

  try {
    // This triggers the real wallet popup
    const accounts = await provider.request({ method: 'eth_requestAccounts' });
    if (!accounts?.length) throw new Error('No accounts');

    _provider = provider;
    _walletId = w.id;

    // Switch / add Ritual Chain
    try {
      await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: RITUAL_CHAIN.chainId }] });
    } catch(e) {
      if (e.code === 4902 || e.code === -32603) {
        try { await provider.request({ method: 'wallet_addEthereumChain', params: [RITUAL_CHAIN] }); } catch(_) {}
      }
    }

    // Watch for changes
    provider.on('accountsChanged', accs => {
      if (!accs.length) { setUIConnected(null); showToast('👋 Wallet disconnected'); }
      else { setUIConnected(accs[0], w.id); showToast('🔄 Account switched'); }
    });
    provider.on('chainChanged', () => showToast('🔗 Network changed'));

    closeWalletModal();
    setUIConnected(accounts[0], w.id);
    showToast(`✓ ${w.name} connected!`);

  } catch(err) {
    wcShowList();
    showToast(err.code === 4001 ? '❌ Rejected by user' : '⚠️ ' + (err.message || 'Connection failed'));
  }
}

function connectWC() {
  closeWalletModal();
  showToast('📱 Use a WalletConnect-compatible app to scan QR');
  window.open('https://walletconnect.com/','_blank');
}

function handleDisconnect() {
  if (_provider?.disconnect) _provider.disconnect().catch(()=>{});
  setUIConnected(null);
  showToast('👋 Wallet disconnected');
}

// ---------- Add Network ----------
async function addNetwork() {
  const p = _provider || window.ethereum;
  if (!p) { showToast('🦊 Connect a wallet first'); openWalletModal(); return; }
  try {
    await p.request({ method: 'wallet_addEthereumChain', params: [RITUAL_CHAIN] });
    showToast('✓ Ritual Chain added!');
  } catch(e) {
    showToast('⚠️ ' + (e.message || 'Could not add network'));
  }
}

// ---------- Auto-reconnect ----------
window.addEventListener('load', async () => {
  for (const w of WALLET_DEFS) {
    const p = w.detect();
    if (!p) continue;
    try {
      const accs = await p.request({ method: 'eth_accounts' });
      if (accs?.length) {
        _provider = p; _walletId = w.id;
        setUIConnected(accs[0], w.id);
        p.on('accountsChanged', a => { if(!a.length) setUIConnected(null); else setUIConnected(a[0],w.id); });
        break;
      }
    } catch(_) {}
  }
});

// =====================
//  MINT
// =====================
// =====================
// RANDOM NFT + REAL WALLET MINT
// =====================

const NFT_IMAGES = [
  'nft/1.png.jpg',
  'nft/2.png.jpg',
  'nft/3.png.jpg',
  'nft/4.png.jpg',
  'nft/5.png.jpg',
  'nft/6.png.jpg'
];

let mintedNFTs = [];

function getRandomNFT() {

  const remaining = NFT_IMAGES.filter(
    img => !mintedNFTs.includes(img)
  );

  if (!remaining.length) {
    alert('All NFTs minted');
    return null;
  }

  const random =
    remaining[Math.floor(Math.random() * remaining.length)];

  mintedNFTs.push(random);

  return random;
}


// =====================
// REAL MINT FUNCTION
// =====================

async function mintNFT() {

  if (!_provider) {
    showToast("Connect wallet first");
    return;
  }

  try {

    const provider =
      new ethers.providers.Web3Provider(_provider);

    const signer = provider.getSigner();

    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      CONTRACT_ABI,
      signer
    );

    showToast("Confirm mint transaction");

    // REAL PUBLIC NFT MINT
    const tx = await contract.mint({
  value: ethers.utils.parseEther("0.05")
});

    showToast("Minting NFT...");

    await tx.wait();

    console.log("NFT Minted:", tx.hash);

    const count =
      document.getElementById("minted-count");

    if (count) {
      count.textContent = (
        parseInt(count.textContent.replace(/,/g,'')) + 1
      ).toLocaleString();
    }

    showToast("🎉 SUCCESSFULLY NFT Minted!");

    window.open(
      `https://explorer.ritualfoundation.org/tx/${tx.hash}`,
      "_blank"
    );

  }

  catch(err) {

    console.error(err);

    showToast(
      err?.reason ||
      err?.message ||
      "Mint failed"
    );

  }

}
// =====================
//  UTILS
// =====================
function copyText(text, btn) {
  navigator.clipboard.writeText(text).catch(() => {
    const el = document.createElement('textarea');
    el.value = text; document.body.appendChild(el); el.select();
    document.execCommand('copy'); document.body.removeChild(el);
  });
  const orig = btn.textContent;
  btn.textContent = 'copied!'; btn.style.color = 'var(--green)';
  setTimeout(() => { btn.textContent = orig; btn.style.color = ''; }, 1500);
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('visible');
  setTimeout(() => t.classList.remove('visible'), 2800);
}

// =====================
//  STATE & NFT
// =====================
const VARIANTS = ['Cosmic','Emerald','Inferno','Nebula','Arctic','Phantom','Aurora','Void'];
const RARITIES = ['Common','Uncommon','Rare','Epic','Legendary'];
const RARITY_COLORS = { Common:'rgba(122,162,247,0.4)', Uncommon:'rgba(34,211,160,0.4)', Rare:'rgba(56,189,248,0.4)', Epic:'rgba(167,139,250,0.4)', Legendary:'rgba(250,199,117,0.4)' };
const RARITY_TEXT = { Common:'#7aa2f7', Uncommon:'#22d3a0', Rare:'#38bdf8', Epic:'#a78bfa', Legendary:'#fac77a' };
const RARITY_SYMBOLS = { Common:'&#9670;', Uncommon:'&#9670;&#9670;', Rare:'&#9670;&#9670;&#9670;', Epic:'&#10022;', Legendary:'&#10022; LEGENDARY' };
const THEMES = [
  { c1:'#6378ff', c2:'#a78bfa', c3:'#38bdf8' },
  { c1:'#22d3a0', c2:'#34d399', c3:'#6ee7b7' },
  { c1:'#f87171', c2:'#fb923c', c3:'#fbbf24' },
  { c1:'#e879f9', c2:'#a78bfa', c3:'#818cf8' },
  { c1:'#38bdf8', c2:'#22d3a0', c3:'#6378ff' },
];
let currentThemeIdx = 0;

function randomNFT() {
  const id = Math.floor(Math.random()*990000)+1000;
  const addr = '0x'+Math.random().toString(16).slice(2,6).toUpperCase()+'...'+Math.random().toString(16).slice(2,6).toUpperCase();
  const rarityIdx = Math.floor(Math.random()*RARITIES.length);
  const rarity = RARITIES[rarityIdx];
  const variantIdx = Math.floor(Math.random()*VARIANTS.length);
  currentThemeIdx = Math.floor(Math.random()*THEMES.length);
  const theme = THEMES[currentThemeIdx];
  document.getElementById('nftName').textContent = 'Blockie #'+id;
  document.getElementById('nftId').textContent = addr+' · ERC-721';
  document.getElementById('attrRarity').textContent = rarity;
  document.getElementById('attrRarity').style.color = RARITY_TEXT[rarity];
  document.getElementById('attrPalette').textContent = VARIANTS[variantIdx];
  const rb = document.getElementById('nftRarityBadge');
  rb.style.borderColor = RARITY_COLORS[rarity];
  rb.style.color = RARITY_TEXT[rarity];
  rb.innerHTML = RARITY_SYMBOLS[rarity];
  updateArtColors(theme);
}

function updateArtColors(theme) {
  const svg = document.getElementById('nftArtSvg');
  if (!svg) return;
  svg.classList.remove('visible');
  setTimeout(() => {
    svg.querySelectorAll('.neural-node').forEach((n,i)=>{
      if(i<3) n.setAttribute('fill',theme.c1);
      else if(i<5) n.setAttribute('fill',theme.c2);
      else if(i>7) n.setAttribute('fill',theme.c3);
      else n.setAttribute('fill',theme.c2);
    });
    svg.querySelectorAll('.neural-line').forEach((l,i)=>{
      if(i<4) l.setAttribute('stroke',theme.c1);
      else if(i<10) l.setAttribute('stroke',theme.c2);
      else l.setAttribute('stroke',theme.c3);
    });
    const cc = svg.querySelectorAll('circle[r="8"]');
    if(cc[0]) cc[0].setAttribute('fill',theme.c1);
    svg.classList.add('visible');
  }, 300);
}

// =====================
//  INIT
// =====================
window.__walletConnected = false;
randomNFT();
setInterval(() => { if(!window.__walletConnected) randomNFT(); }, 5000);
