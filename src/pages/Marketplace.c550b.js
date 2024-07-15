import wixData from 'wix-data';

$w.onReady(function () {
    // Ensure the search function is called when the input value changes
    $w("#input1").onInput(() => {
        console.log("Input event triggered"); // Debugging log
        search();
    });

    function search() {
        const searchTerm = $w("#input1").value;
        console.log("Search term:", searchTerm); // Debugging log

        if (searchTerm) {
            $w("#dataset1").setFilter(wixData.filter()
                .contains('title', searchTerm)  // Replace 'fieldName' with the actual field name
            )
            .then(() => {
                console.log('Dataset filtered successfully.');
            })
            .catch((error) => {
                console.log('Dataset filter error: ', error);
            });
        } else {
            $w("#dataset1").setFilter(wixData.filter())
            .then(() => {
                console.log('Dataset filter cleared.');
            })
            .catch((error) => {
                console.log('Dataset filter error: ', error);
            });
        }
    }
});

import wixData from 'wix-data';
import axios from 'axios';

$w.onReady(function () {
    const apiKeyGoDaddy = 'h1JwpTFRQhWp_DrRSkckGENvAsfY1jw7g8o';

    const domainsToFetch = ['com', 'org', 'co', 'net', 'info']; // Extensions to fetch

    const fetchDomainsFromGoDaddy = async () => {
    const response = await axios.get('https://api.godaddy.com/v1/domains/sales', {
        headers: {
            Authorization: `sso-key ${apiKeyGoDaddy}`
        },
        params: {
            limit: 100,
            offset: offset,
            sort: 'price',
            filter: 'extension:com,org,net,info,co'
        }
    });
    return response.data.domains; // Adjust based on actual API response structure
};


    const constructAffiliateLink = (domainName) => {
        return `https://www.godaddy.com/domainsearch/find?domainToCheck=${domainName}&isc=YOUR_AFFILIATE_CODE`;
    };

    const fetchAndCombineDomains = async () => {
        try {
            const godaddyDomains = await fetchDomainsFromGoDaddy();

            // Filter domains based on criteria
            const filteredDomains = godaddyDomains.filter(domain => {
                const price = domain.price || domain.currentBid; // Adjust based on API response
                const extension = domain.extension || domain.tld; // Adjust based on API response
                const domainName = domain.name || domain.domainName; // Adjust based on API response

                return price >= 50 && price <= 35000 &&
                    !domainName.includes('-') && !/\d/.test(domainName) &&
                    domainsToFetch.includes(extension);
            });

            // Format domains for Wix dataset
            const formattedDomains = filteredDomains.map(domain => ({
                domainName: domain.name || domain.domainName, // Adjust based on API response
                price: domain.price || domain.currentBid, // Adjust based on API response
                timeLeft: domain.timeLeft, // Adjust based on API response
                extension: domain.extension || domain.tld, // Adjust based on API response
                auctionOrBuyNow: domain.auction ? 'Auction' : 'Buy Now', // Adjust based on API response
                affiliateLink: domain.affiliateLink || constructAffiliateLink(domain.name || domain.domainName)
            }));

            // Insert formatted domains into Wix dataset
            await wixData.bulkInsert('dataset1', formattedDomains);

            console.log('Domains added to dataset:', formattedDomains);

            // Check for sold domains and delete them
            const allDatasetItems = await wixData.query('dataset1').find();
            for (let item of allDatasetItems.items) {
                const domain = filteredDomains.find(d => d.name === item.domainName);
                if (!domain) {
                    await wixData.remove('dataset1', item._id);
                    console.log(`Removed sold domain: ${item.domainName}`);
                }
            }
        } catch (error) {
            console.error('Error fetching domains:', error);
        }
    };

    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

    const fetchDomainsWithRateLimit = async () => {
        const requestsPerMinute = 30;
        const interval = 60000 / requestsPerMinute; // milliseconds between requests

        const fetchDomainsLoop = async () => {
            while (true) {
                await fetchAndCombineDomains();
                await delay(interval);
            }
        };

        fetchDomainsLoop();
    };

    fetchDomainsWithRateLimit();
});
