
  import wixData from 'wix-data';

$w.onReady(function () {
    // Set up an event handler for real-time search as the user types
    $w("#searchInput").onInput(() => {
        search();
    });

    function search() {
        const searchTerm = $w("#searchInput").value;

        if (searchTerm) {
            $w("#dataset1").setFilter(wixData.filter()
                .contains('Domain name', searchTerm)  // Replace 'fieldName' with the actual field name
            )
            .then(() => {
                console.log('Dataset filtered successfully.');
            })
            .catch((error) => {
                console.log('Dataset filter error: ', error);
            });
        } else {
            $w("#myDataset").setFilter(wixData.filter())
            .then(() => {
                console.log('Dataset filter cleared.');
            })
            .catch((error) => {
                console.log('Dataset filter error: ', error);
            });
        }
    }
});
 
