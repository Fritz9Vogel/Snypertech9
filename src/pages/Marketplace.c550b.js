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

