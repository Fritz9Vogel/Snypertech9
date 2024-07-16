// Import Wix APIs
import wixData from 'wix-data';
import wixTable from 'wix-table';

// Set API request limit to 30 requests per minute
const API_REQUEST_LIMIT = 30;
const API_REQUEST_INTERVAL = 60000; // 1 minute
let apiRequestCount = 0;
let lastApiRequestTime = 0;

// Set GoDaddy API endpoint and API key (use environment variables or secure storage)
const GODADDY_API_ENDPOINT = 'https://api.godaddy.com/v1/domains';
const GODADDY_API_KEY = process.env.GODADDY_API_KEY || 'h1JwpTFRQhWp_DrRSkckGENvAsfY1jw7g8o';

// Set Wix dataset and table IDs
const DATASET_ID = 'dataset1';
const TABLE_ID = 'table1';

// Create search bar and filter elements
const searchBar = $w('#searchBar');
const priceMinInput = $w('#priceMinInput');
const priceMaxInput = $w('#priceMaxInput');
const timeLeftMinInput = $w('#timeLeftMinInput');
const timeLeftMaxInput = $w('#timeLeftMaxInput');
const auctionOrBuyNowDropdown = $w('#auctionOrBuyNowDropdown');
const extensionDropdown = $w('#extensionDropdown');
const applyFiltersButton = $w('#applyFiltersButton');

// Create table element
const table = $w(`#${TABLE_ID}`);

// Function to get GoDaddy API data with error handling
async function getGodaddyData(domainName) {
  try {
    const apiUrl = `${GODADDY_API_ENDPOINT}/${domainName}`;
    const headers = {
      'Authorization': `Bearer ${GODADDY_API_KEY}`,
      'Content-Type': 'application/json'
    };
    const response = await fetch(apiUrl, { headers });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching GoDaddy API data: ${error}`);
    return null;
  }
}

// Function to add data to Wix dataset with error handling
async function addDataToDataset(domainName, price, timeLeft, extension, auctionOrBuyNow, affiliateLink) {
  try {
    const dataset = wixData.dataset(DATASET_ID);
    const item = {
      'domainName': domainName,
      'price': price,
      'timeLeft': timeLeft,
      'extension': extension,
      'auctionOrBuyNow': auctionOrBuyNow,
      'affiliateLink': affiliateLink
    };
    await dataset.add(item);
  } catch (error) {
    console.error(`Error adding data to Wix dataset: ${error}`);
  }
}

// Function to delete sold domain from dataset with error handling
async function deleteSoldDomain(domainName) {
  try {
    const dataset = wixData.dataset(DATASET_ID);
    const query = wixData.query().eq('domainName', domainName);
    const items = await dataset.query(query);
    if (items.length > 0) {
      await dataset.remove(items[0]._id);
    }
  } catch (error) {
    console.error(`Error deleting sold domain from dataset: ${error}`);
  }
}

// Function to search for domains as user types
searchBar.onInput((event) => {
  const searchTerm = event.target.value;
  const dataset = wixData.dataset(DATASET_ID);
  const query = wixData.query().contains('domainName', searchTerm);
  dataset.query(query).then((items) => {
    table.data = items.items;
  }).catch((error) => {
    console.error(`Error searching for domains: ${error}`);
  });
});

// Function to apply filters
applyFiltersButton.onClick(() => {
  const priceMin = priceMinInput.value;
  const priceMax = priceMaxInput.value;
  const timeLeftMin = timeLeftMinInput.value;
  const timeLeftMax = timeLeftMaxInput.value;
  const auctionOrBuyNow = auctionOrBuyNowDropdown.value;
  const extension = extensionDropdown.value;
  const dataset = wixData.dataset(DATASET_ID);
  const query = wixData.query()
    .gte('price', priceMin)
    .lte('price', priceMax)
    .gte('timeLeft', timeLeftMin)
    .lte('timeLeft', timeLeftMax)
    .eq('auctionOrBuyNow', auctionOrBuyNow)
    .eq('extension', extension);
  dataset.query(query).then((items) => {
    table.data = items.items;
  }).catch((error) => {
    console.error(`Error applying filters: ${error}`);
  });
});

// Function to get affiliate link with error handling
async function getAffiliateLink(domainName) {
  try {
    const apiUrl = `https://api.godaddy.com/v1/domains/${domainName}/affiliate-link`;
    const headers= {
      'Authorization': `Bearer ${GODADDY_API_KEY}`,
      'Content-Type': 'application/json'
    };
    const response = await fetch(apiUrl, { headers });
    const data = await response.json();
    return data.affiliateLink;
  } catch (error) {
    console.error(`Error fetching affiliate link: ${error}`);
    return null;
  }
}

// Function to add data to dataset and get affiliate link with error handling
async function addDataAndGetAffiliateLink(domainName) {
  try {
    const godaddyData = await getGodaddyData(domainName);
    const price = godaddyData.price;
    const timeLeft = godaddyData.timeLeft;
    const extension = godaddyData.extension;
    const auctionOrBuyNow = godaddyData.auctionOrBuyNow;
    const affiliateLink = await getAffiliateLink(domainName);
    await addDataToDataset(domainName, price, timeLeft, extension, auctionOrBuyNow, affiliateLink);
  } catch (error) {
    console.error(`Error adding data to dataset and getting affiliate link: ${error}`);
  }
}

// Function to check if domain is sold with error handling
async function checkIfDomainIsSold(domainName) {
  try {
    const godaddyData = await getGodaddyData(domainName);
    if (godaddyData.status === 'old' || godaddyData.status === 'unavailable') {
      await deleteSoldDomain(domainName);
    }
  } catch (error) {
    console.error(`Error checking if domain is sold: ${error}`);
  }
}

// Set interval to check for sold domains with error handling
setInterval(async () => {
  try {
    const dataset = wixData.dataset(DATASET_ID);
    const items = await dataset.getItems();
    for (const item of items) {
      await checkIfDomainIsSold(item.domainName);
    }
  } catch (error) {
    console.error(`Error checking for sold domains: ${error}`);
  }
}, API_REQUEST_INTERVAL); // Check every 1 minute

// Set interval to add new data to dataset with error handling and performance optimization
setInterval(async () => {
  try {
    const apiUrl = `${GODADDY_API_ENDPOINT}/search`;
    const headers = {
      'Authorization': `Bearer ${GODADDY_API_KEY}`,
      'Content-Type': 'application/json'
    };
    const response = await fetch(apiUrl, { headers });
    const data = await response.json();
    const domainsToProcess = [];
    for (const domain of data.domains) {
      if (domain.price >= 50 && domain.price <= 35000 &&!domain.domainName.includes('-') &&!domain.domainName.includes('.') &&!domain.domainName.includes(' ') && ['com', 'org', 'co', 'net', 'info'].includes(domain.extension)) {
        domainsToProcess.push(domain.domainName);
      }
    }
    // Batch API requests to reduce load on GoDaddy API
    const batchSize = 10;
    for (let i = 0; i < domainsToProcess.length; i += batchSize) {
      const batch = domainsToProcess.slice(i, i + batchSize);
      await Promise.all(batch.map(addDataAndGetAffiliateLink));
    }
  } catch (error) {
    console.error(`Error adding new data to dataset: ${error}`);
  }
}, API_REQUEST_INTERVAL / 2); // Add new data every 30 seconds

// Function to check API request limit with error handling
async function checkApiRequestLimit() {
  try {
    const currentTime = new Date().getTime();
    if (apiRequestCount >= API_REQUEST_LIMIT && currentTime - lastApiRequestTime < API_REQUEST_INTERVAL) {
      console.log('API request limit reached. Waiting 1 minute...');
      await new Promise(resolve => setTimeout(resolve, API_REQUEST_INTERVAL));
    }
    apiRequestCount++;
    lastApiRequestTime = currentTime;
  } catch (error) {
    console.error(`Error checking API request limit: ${error}`);
  }
}
