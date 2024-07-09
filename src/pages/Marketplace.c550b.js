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

$w.onReady(function () {
    // Event handler for the filter button
    $w("#button1").onClick(() => {
        applyFilters();
    });

    function applyFilters() {
        // Get values from input elements
        const priceMin = $w("#input2").value ? Number($w("#input2").value) : null;
        const priceMax = $w("#input3").value ? Number($w("#input3").value) : null;
        const domainExtension = $w("#dropdown1").value || null;
        const auctionOrBuyNow = $w("#dropdown2").value ? ($w("#dropdown2").value === "Auction" ? 1 : 0) : null;
        const timeLeftMin = $w("#input4").value ? parseTimeLeft($w("#input4").value) : null;
        const timeLeftMax = $w("#input5").value ? parseTimeLeft($w("#input5").value) : null;
        const textLengthMin = $w("#input6").value ? Number($w("#input6").value) : null;
        const textLengthMax = $w("#input7").value ? Number($w("#input7").value) : null;

        // Build the filter
        let filter = wixData.filter();
        
        if (priceMin !== null) {
            filter = filter.ge('priceCurrentBid', priceMin);
        }
        if (priceMax !== null) {
            filter = filter.le('priceCurrentBid', priceMax);
        }
        if (domainExtension !== null) {
            filter = filter.contains('title', domainExtension);
        }
        if (auctionOrBuyNow !== null) {
            filter = filter.eq('boolean', auctionOrBuyNow);
        }
        if (timeLeftMin !== null && timeLeftMax !== null) {
            filter = filter.between('timeLeft', timeLeftMin, timeLeftMax);
        } else if (timeLeftMin !== null) {
            filter = filter.ge('timeLeft', timeLeftMin);
        } else if (timeLeftMax !== null) {
            filter = filter.le('timeLeft', timeLeftMax);
        }
        if (textLengthMin !== null) {
            filter = filter.ge('title', textLengthMin);
        }
        if (textLengthMax !== null) {
            filter = filter.le('title', textLengthMax);
        }

        // Apply the filter to the dataset
        $w("#dataset1").setFilter(filter)
        .then(() => {
            console.log('Dataset filtered successfully.');
        })
        .catch((error) => {
            console.log('Dataset filter error: ', error);
        });
    }

    function parseTimeLeft(input) {
        if (!input) {
            return null;
        }
        const [days, hours] = input.split(' ').map(part => {
            const value = parseInt(part);
            return isNaN(value) ? 0 : value;
        });
        return days * 24 + hours; // Convert days to hours and add the hours
    }
});
